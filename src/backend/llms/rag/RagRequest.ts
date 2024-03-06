import {RagResponse} from "@/backend/llms/rag/RagResponse";

export interface RagRequest<A> {
    input: string
    scopeId: string
    previousResponses: RagResponse<A>[]
}