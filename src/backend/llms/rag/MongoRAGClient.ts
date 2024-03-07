import logger from 'pino'
import {MongoVectorCollection} from "@/backend/databases/mongodb/MongoVectorCollection";
import {OpenAILLM} from "@/backend/llms/OpenAILLM";
import {RagResponse} from "@/backend/llms/rag/RagResponse";

interface ContextBasedResponse {
    answer: string
    contextIds: string[]
}

export interface RAGSource {
    id: string
    scopeId: string //todo add filter for this
    sourceName: string
    content: string
    url?: string
}

export class MongoRAGClient<A extends RAGSource> {

    private log = logger()
    private contextIdKey: string = "CTX-ID"
    private contextKey: string = "CONTEXT"

    /**
     *
     * @param collection
     * @param llm
     * @param makeDocumentContext Function to create the document's context text that will be injected into the prompt
     * @param contextChunksLimit Limit the number of documents that should be injected to the prompt
     */
    constructor(
        protected collection: MongoVectorCollection<A>,
        protected llm: OpenAILLM,
        protected makeDocumentContext: (document: A) => string,
        protected contextChunksLimit: number //todo change to auto context size limiting
    ) {
    }

    static fromEnv<A extends RAGSource>(
        collection: MongoVectorCollection<A>,
        llm: OpenAILLM,
        makeDocumentContext: (document: A) => string
    ): MongoRAGClient<A> {

        const {RAG_CONTEXT_CHUCKS_LIMIT} = process.env
        const limit = !!RAG_CONTEXT_CHUCKS_LIMIT ? Number(RAG_CONTEXT_CHUCKS_LIMIT) : 15
        if (!RAG_CONTEXT_CHUCKS_LIMIT) {
            console.log("No ENV provided for RAG_CONTEXT_CHUCKS_LIMIT")
        }

        return new MongoRAGClient<A>(collection, llm, makeDocumentContext, limit)
    }

    async runInference(input: string, scopeId: string): Promise<RagResponse<A>> {

        const relevantDocs = await this.collection.semanticVectorSearch(input, scopeId)
        const relevantDocsLimited = relevantDocs.splice(0, this.contextChunksLimit)

        const prompt = this.makePrompt(input, relevantDocsLimited)
        const finalResponse = await this.llm.chatCompletionAsObject<ContextBasedResponse>(prompt)

        const usedDocuments = relevantDocsLimited.filter((document) => {
            const id = document.id
            return finalResponse.contextIds.includes(id)
        })

        return {
            input: input,
            output: finalResponse.answer,
            references: usedDocuments
        } as RagResponse<A>
    }

    async runInferenceWithImage(input: string, scopeId: string, imageUrl: string): Promise<RagResponse<A>> {

        const imageDescription = await this.llm.imageToTextB64WithResize(imageUrl)

        // find relevant docs
        const searchTextWithImage = `${input}. Image description: ${imageDescription}`
        const relevantDocs = await this.collection.semanticVectorSearch(searchTextWithImage, scopeId)
        const relevantDocsLimited = relevantDocs.splice(0, this.contextChunksLimit)

        // prompt and get response
        const prompt = this.makePrompt(input, relevantDocsLimited, imageDescription)
        const finalResponse = await this.llm.chatCompletionAsObject<ContextBasedResponse>(prompt)

        // find referenced docs
        const usedDocuments = relevantDocsLimited.filter((document) => {
            const id = document.id
            return finalResponse.contextIds.includes(id)
        })

        return {
            input: input,
            output: finalResponse.answer,
            references: usedDocuments
        } as RagResponse<A>
    }

    private makePrompt(input: string, contexts: A[], imageContext?: string): string {

        console.log("context")
        console.log(contexts)
        const contextString = contexts
            .map((document) => `${this.contextIdKey}: ${document.id} -> ${this.contextKey}: ${this.makeDocumentContext(document)}`)
            .join(' || ')

        const imagePromptContext = !!imageContext ? `--------------------\n Here a description of the image attached to the question: ${imageContext}` : ""

        return (
            `Help to answer the following question. I will give you extra context you must use to answer the question. The information you use to answer
            the question can only be drawn from the provided context pieces, and not from your own trained memory. I provided context in the 
            format "${this.contextIdKey} -> ${this.contextKey} || ${this.contextIdKey} -> ${this.contextKey}".
        
            Your response should contain your answer, together with an array of the IDs for the contexts you used to answer the question. It should be in the following
            JSON format: { "answer": "your answer to question", "contextIds": ["id1", "id2"] }.
            --------------------
            Here context to use to answer the question: ${contextString}
            ${imagePromptContext}
            --------------------
            Here is the question: ${input}`)
    }


}

