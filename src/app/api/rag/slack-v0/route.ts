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
}

export async function POST(req: Request) {

    const mongoInstance = await MongoInstance.fromEnv()
    const embeddingsProvider = OpenAIEmbeddingsProvider.fromEnv("text-embedding-ada-002")
    const llmClient = OpenAILLM.fromEnv('gpt-3.5-turbo')

    const publications = new MongoVectorCollection<PrewaveRagSource>(
        "publications",
        mongoInstance,
        embeddingsProvider,
        "publications-vector-index",
        "embedding_vector",
        (document: PrewaveRagSource) => MarkdownSplitter.removeMarkdownCharacters(document.content)
    )

    const ragClient = new MongoRAGClient<PrewaveRagSource>(
        publications,
        llmClient,
        (document: PrewaveRagSource) => document.content)

    const request = await req.json() as BasicRequest
    const res = await ragClient.runInference(request.question, "request.scopeId")

    return NextResponse.json(res)
}
