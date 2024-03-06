import OpenAI from 'openai';
import Embeddings = OpenAI.Embeddings;
import {EmbeddingProvider} from "@/backend/embeddings/EmbeddingsProvider";

export class OpenAIEmbeddingsProvider implements EmbeddingProvider {

    openAIClient: OpenAI

    constructor(public model: string, APIKey: string) {
        this.openAIClient = new OpenAI({apiKey: APIKey})
    }

    static fromEnv(model: string): OpenAIEmbeddingsProvider {
        const {OPENAI_API_KEY} = process.env
        if (!OPENAI_API_KEY) {
            throw new Error('Please define the OPENAI_API_KEY environment variable')
        }
        return new OpenAIEmbeddingsProvider(model, OPENAI_API_KEY)
    }

    async createEmbedding(input: string): Promise<number[]> {
        const config = {input: input, model: this.model} as Embeddings.EmbeddingCreateParams
        const response = await this.openAIClient.embeddings.create(config)
        return response.data[0].embedding
    }

}
