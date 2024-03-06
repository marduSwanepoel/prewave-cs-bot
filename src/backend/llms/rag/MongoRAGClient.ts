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
     * @param contextDocumentsLimit Limit the number of documents that should be injected to the prompt
     */
    constructor(
        protected collection: MongoVectorCollection<A>,
        protected llm: OpenAILLM,
        protected makeDocumentContext: (document: A) => string,
        protected contextDocumentsLimit: number = 3 //todo change to auto context size limiting
    ) {
    }

    async runInference(input: string, scopeId: string): Promise<RagResponse<A>> {
        const relevantDocs = await this.collection.semanticVectorSearch(input, scopeId)
        const relevantDocsLimited = relevantDocs.splice(0, this.contextDocumentsLimit)

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

    private makePrompt(input: string, contexts: A[]): string {
        const contextString = contexts
            .map((document) => `${this.contextIdKey}: ${document.id} -> ${this.contextKey}: ${this.makeDocumentContext(document)}`)
            .join(' || ')

        return (
            `Help to answer the following question. I will give you extra context you must use to answer the question. The information you use to answer
            the question can only be drawn from the provided context pieces, and not from your own trained memory. I provided context in the 
            format "${this.contextIdKey} -> ${this.contextKey} || ${this.contextIdKey} -> ${this.contextKey}".
        
            Your response should contain your answer, together with an array of the IDs for the contexts you used to answer the question. It should be in the following
            JSON format: { "answer": "your answer to question", "contextIds": ["id1", "id2"] }.
            --------------------
            Here is the question: ${input}
            --------------------
            Here is the context: ${contextString}`)
    }


}

