import {RAGSource} from "@/backend/llms/rag/MongoRAGClient";

export interface PrewaveRagSource extends RAGSource {
    url: string
}