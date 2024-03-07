import logger from 'pino'
import {MongoVectorCollection} from "@/backend/databases/mongodb/MongoVectorCollection";
import {OpenAILLM} from "@/backend/llms/OpenAILLM";
import {RagResponse} from "@/backend/llms/rag/RagResponse";

export interface ContextBasedResponse {
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

    removeTextAfterImageDescription(input: string): string {
        const index = input.indexOf("Image description: ");

        if (index !== -1) {
            return input.substring(0, index + "Image description: ".length);
        } else {
            return input;
        }
    }

    async runInferenceWithImage(input: string, scopeId: string, imageUrl: string): Promise<RagResponse<A>> {

        const imageDescription = await this.llm.imageToTextB64WithResize(imageUrl, "Given the following screenshot of a web interface. Generate a very description that I can use in a documentation. Maximum 2 sentences.")

        // find relevant docs for image
        const searchTextWithImage = `Image description: ${imageDescription}`
        const imageDescriptionDocs = await this.collection.semanticVectorSearch(searchTextWithImage, scopeId)
        const relevantImageDocsLimited = imageDescriptionDocs.splice(0, this.contextChunksLimit)
        const imageDocsText = relevantImageDocsLimited.map((doc) => {
            return this.removeTextAfterImageDescription(doc.content)
        }).join('. ')

        const contentAndImageText = `${input}. ${imageDocsText}`
        const contentAndImageRelevantDocs = await this.collection.semanticVectorSearch(contentAndImageText, scopeId)
        const contentAndImageRelevantDocsLimited = contentAndImageRelevantDocs.splice(0, this.contextChunksLimit)

        // prompt and get response
        const prompt = this.makeImagePrompt(input, contentAndImageRelevantDocsLimited, imageDescription)
        const finalResponse = await this.llm.chatCompletionAsObject<ContextBasedResponse>(prompt)

        // find referenced docs
        const usedDocuments = contentAndImageRelevantDocsLimited.filter((document) => {
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
            `You are confident PrewaveBot who helps users to navigate the Prewave knowledge base. Help users to answer questions about Prewave knowledge. 
            Aim for responses that are clear, concise, and personalized, using no more than four sentences. Your goal is to make users feel supported and understood.
            
            I will give you needed context you must use to answer the question. The information you use to answer the question can only be drawn from the provided 
            context pieces, and not from your own trained memory. If you do not have the context to give a good answer, say you do not know the
            answer instead of making something up. I will provided context in the format "${this.contextIdKey} -> ${this.contextKey} || ${this.contextIdKey} -> ${this.contextKey}".
        
            Your response should contain your answer, together with an array of the IDs for the contexts you used to answer the question. If you were not able to give a successfull answer,
            keep the array of the IDs for the contexts empty. Your response should be in the following
            JSON format: { "answer": "your answer to question", "contextIds": ["id1", "id2"] }.
            
            Context:
            """
            ${contextString}
            """
        
            Question: ${input}
            
            Answer:`)
    }

    private makeImagePrompt(input: string, contexts: A[], imageContext: string): string {

        const contextString = contexts
            .map((document) => `${this.contextIdKey}: ${document.id} -> ${this.contextKey}: ${this.makeDocumentContext(document)}`)
            .join(' || ')

        const updatedPrompt = `
        You are confident PrewaveBot who helps users to navigate and understand Prewave's web interface.
        Use the following pieces of context to answer the user's question based on the text of the question and a description of an attached web interface image.
        If you don't know the answer, just say that you don't know, don't try to make up an answer. Be confident in your answers, and don't use words like like and I think.
        Your goal is to make users feel supported and understood, ensuring they can navigate the platform's features with confidence. Highlight key functionalities, 
        offer tips for optimal usage, and guide them toward discovering valuable insights on their own. 
        Aim for responses that are clear, concise, and personalized, using no more than four sentences.
        
        I provide the context in the format "${this.contextIdKey} -> ${this.contextKey} || ${this.contextIdKey} -> ${this.contextKey}".
        Your response should contain your answer, together with an array of the IDs for the contexts you used to answer the question. Your question should be in the following
        JSON format: { "answer": "your answer to question", "contextIds": ["id1", "id2"] }.
            
        Context:
        """
        ${contextString}
        """
        
        Question: ${input}
        UI Screenshot Description: """ + ${imageContext} + """
        Answer:"""
        `
        // return (
        //     `Help to answer a question that includes an image as attachement. I will give you the question, detailed description of the image, and extra context
        //      related to the question and image which you must use to answer the question. The information you use to answer
        //     the question can only be drawn from the provided context pieces, and not from your own trained memory. I provide the context in the
        //     format "${this.contextIdKey} -> ${this.contextKey} || ${this.contextIdKey} -> ${this.contextKey}".
        //
        //     Your response should contain your answer, together with an array of the IDs for the contexts you used to answer the question. It should be in the following
        //     JSON format: { "answer": "your answer to question", "contextIds": ["id1", "id2"] }.
        //     --------------------
        //     Here is a description of the image that was provided as attachment to the question: ${imageContext}
        //     --------------------
        //     Here is the context to use to answer the question: ${contextString}
        //     --------------------
        //     Here is the question you should answer: ${input}`)

        return updatedPrompt
    }

}

