import {NextResponse} from 'next/server';
import {MongoInstance} from "@/backend/databases/mongodb/MongoInstance";
import {OpenAIEmbeddingsProvider} from "@/backend/embeddings/OpenAIEmbeddingsProvider";
import {OpenAILLM} from "@/backend/llms/OpenAILLM";
import {MongoVectorCollection} from "@/backend/databases/mongodb/MongoVectorCollection";
import {PrewaveRagSource} from "@/domain/prewave/PrewaveRagSource";
import {MongoRAGClient} from "@/backend/llms/rag/MongoRAGClient";
import {MarkdownSplitter} from "@/backend/common/MarkdownSplitter";
import {RagResponse} from "@/backend/llms/rag/RagResponse";

interface BasicRequest {
    question: string
    imageUrl?: string
}

export async function POST(req: Request) {

    const mongoInstance = await MongoInstance.fromEnv()
    const client = new HackathonClient(mongoInstance)

    const request = await req.json() as BasicRequest
    const answerRequest = await client.handleWithRoute(request)

    const res = await answerRequest

    return NextResponse.json(res)
}


class HackathonClient {

    embeddingsProvider = OpenAIEmbeddingsProvider.fromEnv("text-embedding-3-small")
    llmClient = OpenAILLM.fromEnv('gpt-4-turbo-preview')
    llmGpt3 = OpenAILLM.fromEnv('gpt-3.5-turbo')
    publications = new MongoVectorCollection<PrewaveRagSource>(
        "publications",
        this.mongoInstance,
        this.embeddingsProvider,
        "publications-vector-index",
        "embedding_vector",
        (document: PrewaveRagSource) => MarkdownSplitter.removeMarkdownCharacters(document.content)
    )

    ragClient = MongoRAGClient.fromEnv<PrewaveRagSource>(
        this.publications,
        this.llmClient,
        (document: PrewaveRagSource) => document.content)

    constructor(public mongoInstance: MongoInstance) {
    }

    async handleWithRoute(request: BasicRequest) {
        const action = await this.routeQuestion(request.question)
        switch (action) {
            case "MISSED_ALERT":
                console.log("processing MISSED_ALERT")
                return this.submitMissedAlert(request.question)
            case "Q_AND_A":
                console.log("processing Q_AND_A")
                return this.answerKnowledgeBaseQuestion(request.question)
            case "IMAGE_ANALYSIS":
                console.log("processing IMAGE_ANALYSIS")
                return this.answerKnowledgeBaseQuestion(request.question)
            case "EXPLAIN_ALERTS":
                console.log("processing EXPLAIN_ALERTS")
                return this.answerKnowledgeBaseQuestion(request.question)
            default :
                console.log("processing default")
                return this.answerKnowledgeBaseQuestion(request.question)
        }
    }

    answerKnowledgeBaseQuestion(question: string): Promise<RagResponse<PrewaveRagSource>> {
        return this.ragClient.runInference(question, "")
    }

    submitMissedAlert(question: string): Promise<RagResponse<PrewaveRagSource>> {
        const prompt = `Help me to create a JSON object that I can use to submit a missed alert. In order to do so, you have to extract three things from the question:
        1. Target type: The target type referred to. This can only be a Organization, commodity or industry.
        2. The target name that is referred to. This must be present.
        3. The event type that is mentioned to have occurred, this can only be partnership or theft.
        4. The URL that points to the website describing the alert details, this must be present.
        
        IF you are not able to extract all the above from the question it is a failure, and you should return this JSON object and replace YOUR_ANSWER with an explaination of why the alert could not be created, as in what was missing from the question:
         { "answer": "YOUR_ANSWER", "contextIds": []}
         
        BUT if you are able to successfully extract the info from the question, return the following JSON structure that captures your results extracted and replace YOUR_ANSWER with a sentence in human language providing a summary of the missed alert you created: 
        { "answer": "YOUR_ANSWER", "contextIds": ["https://services.prewave.ai/adminInterface/missedAlerts/overview/form?json=%7B%22start%22%3A%222024-03-06T08%3A00%3A00Z%22%2C%22end%22%3A%222024-03-06T09%3A22%3A00Z%22%2C%22showArchived%22%3Afalse%7D"] }
        
        Here is th question: ${question}
        `

        return this.llmClient.chatCompletionAsObject<RagResponse<PrewaveRagSource>>(prompt, "You are an expert at extracting content into JSON")
    }

    //NOTES specify "missed alert", or "attached screenshot" or "explain" in the prompt
    routeQuestion(question: string): Promise<string> {
        const prompt = `Given a question, help me to understand which task I should perform. I will give you the tasks, an overview of each task, and then the task key
        you should return if the question matches the task to do. Here are the tasks:
        1. If the questions asks to create a missed alert given a url and information about the alert. Key = MISSED_ALERT
        2. If an answer is received that asks to explain terminology or a concept, use information from a knowledgebase to answer the question. Key = Q_AND_A
        3. If an image is attached and the user want to better understand it, or find content relevant to it, do image analysis. Key = IMAGE_ANALYSIS
        4. If the question wants to find information about recent alerts that it has received. Key = EXPLAIN_ALERTS.
        
        For your answer, ONLY return the correct task key, nothing else. Example, question: help me to create this missed alert for Hilti at url www.abc.com -> answer: MISSED_ALERT
        
        Here is the question you should analyse: ${question}`

        return this.llmGpt3.chatCompletion(prompt, "you are good at deriving tasks from answers", 0.3, "text")
    }


}