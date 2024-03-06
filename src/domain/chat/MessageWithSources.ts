import {PrewaveRagSource} from "@/domain/prewave/PrewaveRagSource";

export interface MessageWithSources {
    role: 'user' | 'bot'
    text: string
    sources?: PrewaveRagSource[]
}