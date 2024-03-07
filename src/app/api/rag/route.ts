import {NextResponse} from 'next/server';
import {MongoInstance} from "@/backend/databases/mongodb/MongoInstance";
import {OpenAIEmbeddingsProvider} from "@/backend/embeddings/OpenAIEmbeddingsProvider";
import {OpenAILLM} from "@/backend/llms/OpenAILLM";
import {MongoVectorCollection} from "@/backend/databases/mongodb/MongoVectorCollection";
import {PrewaveRagSource} from "@/domain/prewave/PrewaveRagSource";
import {MongoRAGClient} from "@/backend/llms/rag/MongoRAGClient";
import {MarkdownSplitter} from "@/backend/common/MarkdownSplitter";

interface BasicRequest {
    question: string
    imageUrl?: string
}

export async function POST(req: Request) {

    const mongoInstance = await MongoInstance.fromEnv()
    const embeddingsProvider = OpenAIEmbeddingsProvider.fromEnv("text-embedding-3-small")
    const llmClient = OpenAILLM.fromEnv('gpt-4-turbo-preview')

    const publications = new MongoVectorCollection<PrewaveRagSource>(
        "publications",
        mongoInstance,
        embeddingsProvider,
        "publications-vector-index",
        "embedding_vector",
        (document: PrewaveRagSource) => MarkdownSplitter.removeMarkdownCharacters(document.content)
    )

    const ragClient = MongoRAGClient.fromEnv<PrewaveRagSource>(
        publications,
        llmClient,
        (document: PrewaveRagSource) => document.content)

    const request = await req.json() as BasicRequest
    console.log(`request.question: ${request.question}`)

    const answerRequest = !!request.imageUrl ?
        ragClient.runInferenceWithImage(request.question, "", request.imageUrl) :
        ragClient.runInference(request.question, "")

    const res = await answerRequest

    return NextResponse.json(res)
}
