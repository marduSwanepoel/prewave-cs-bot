import {NextResponse} from 'next/server';
import {MongoInstance} from "@/backend/databases/mongodb/MongoInstance";
import {OpenAIEmbeddingsProvider} from "@/backend/embeddings/OpenAIEmbeddingsProvider";
import {OpenAILLM} from "@/backend/llms/OpenAILLM";
import {MongoVectorCollection} from "@/backend/databases/mongodb/MongoVectorCollection";
import {PrewaveRagSource} from "@/domain/prewave/PrewaveRagSource";
import {ContextBasedResponse, MongoRAGClient} from "@/backend/llms/rag/MongoRAGClient";
import {MarkdownSplitter} from "@/backend/common/MarkdownSplitter";
import {RagResponse} from "@/backend/llms/rag/RagResponse";
import {MongoCollection} from "@/backend/databases/mongodb/MongoCollection";

interface BasicRequest {
    question: string
    imageUrl?: string
}

export const maxDuration = 100;

export async function POST(req: Request) {

    const mongoInstance = await MongoInstance.fromEnv()
    const client = new HackathonClient(mongoInstance)

    const request = await req.json() as BasicRequest
    const answerRequest = await client.handleWithRoute(request)

    const res = await answerRequest

    return NextResponse.json(res)
}

interface AlertInfo {
    title: string
    text: string
    url: string
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

    alertsCollection = new MongoCollection<AlertInfo>("alerts", this.mongoInstance)

    ragClient = MongoRAGClient.fromEnv<PrewaveRagSource>(
        this.publications,
        this.llmClient,
        (document: PrewaveRagSource) => document.content)

    constructor(public mongoInstance: MongoInstance) {
    }

    // explain to me what is Lksg, and how Prewave can help me in that context
    // create a missed alert for Mitsibushi, who were involved in Theft. Here is the article: https://www.mining.com/web/frontier-lithium-mitsubishi-form-jv-for-canadian-lithium-operations/
    // create a missed alert for Mitsibushi. Here is the article: https://www.mining.com/web/frontier-lithium-mitsubishi-form-jv-for-canadian-lithium-operations/
    // create a missed alert for Texas USA, where Theft occurred. Here is the article: https://www.mining.com/web/frontier-lithium-mitsubishi-form-jv-for-canadian-lithium-operations/


    async handleWithRoute(request: BasicRequest) {
        console.log(`REQUEST: ${JSON.stringify(request)}`)
        console.log(`request.imageUrl: ${request.imageUrl}`)
        if (!!request.imageUrl) {
            console.log("processing IMAGE_ANALYSIS")
            return this.explainImage(request.question, request.imageUrl)
        }
        const action = await this.routeQuestion(request.question)
        switch (action) {
            case "MISSED_ALERT":
                console.log("processing MISSED_ALERT")
                return this.submitMissedAlert(request.question)
            case "Q_AND_A":
                console.log("processing Q_AND_A")
                return this.answerKnowledgeBaseQuestion(request.question)
            case "EXPLAIN_ALERTS":
                console.log("processing EXPLAIN_ALERTS")
                return this.explainAlert(request.question)
            default :
                console.log("processing DEFAULT")
                return this.answerKnowledgeBaseQuestion(request.question)
        }
    }

    answerKnowledgeBaseQuestion(question: string): Promise<RagResponse<PrewaveRagSource>> {
        return this.ragClient.runInference(question, "")
    }

    explainImage(question: string, imageUrl: string): Promise<RagResponse<PrewaveRagSource>> {
        return this.ragClient.runInferenceWithImage(question, "", imageUrl)
    }

    async explainAlert(question: string): Promise<RagResponse<PrewaveRagSource>> {
        const alerts = await this.alertsCollection.findAll()
        const prompt = this.makeAlertPrompt(question, alerts)
        const llmResponse = await this.llmClient.chatCompletionAsObject<ContextBasedResponse>(prompt)

        const usedDocuments = llmResponse.contextIds.map((url) => {
            return {
                id: "string",
                scopeId: "",
                sourceName: "",
                content: "string",
                url
        }  as PrewaveRagSource })

        return {
            input: question,
            output: llmResponse.answer,
            references: usedDocuments
        } as RagResponse<PrewaveRagSource>
    }

    makeAlertPrompt(question: string, alerts: AlertInfo[]) {
        const contextString = alerts
            .map((alert) => `${alert.title} --> ${alert.url} --> ${alert.text} --> `)
            .join(' || ')

        return `
        You are confident PrewaveBot who helps users to understand their Alerts, which is a Prewave concept refering to news articles that represent events relevant to a customer's 
        supply chain. Use the customer's Alerts I will give to you to answer the questions that they have about their alerts.
        If you don't know the answer, just say that you don't know, don't try to make up an answer. Be confident in your answers.
        Your goal is to make users feel supported and understood, ensuring they can navigate the platform's features with confidence.
        Aim for responses that are clear, concise, and personalized, using no more than four sentences.
        
        I provide the alerts in the format "ALERT_TITLE --> ALERT_URL --> ALERT_TEXT || ALERT_TITLE --> ALERT_URL --> ALERT_TEXT || ...".
        Your response should contain your answer, together with an array of the alert Titles and URLs that are relevant to the question you answered
        JSON format: { "answer": "your answer to question", "contextIds": ["alert_title, alert_url", "alert_title, alert_url", ...] }.
            
        Alerts for context:
        """
        ${contextString}
        """
        
        Question about alerts: ${question}
        Answer:"""
        `
    }

    submitMissedAlert(question: string): Promise<RagResponse<PrewaveRagSource>> {
        const prompt = `Help me to create a JSON object that I can use to submit a missed alert. In order to do so, you have to extract three things from the question:
        1. Target type: The target type referred to. This can only be a Organization, commodity or industry.
        2. The target name that is referred to. This must be present.
        3. The event type that is mentioned to have occurred, this can only be partnership, theft, strike or corruption.
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
        const prompt =
            `You are an expert at mapping questions to relevant actions. I will give you a question, the rules that map a question to an action, and you should analyse 
            the question to find the best fitting action given for the question. Here are the actions with their respective task keys, and what questions should route to these actions:
            Action 1: If the questions asks to specifically create a new missed alert given a url, return key MISSED_ALERT.
            Action 2: If the questions asks to explain terminology or a concept or get more details on some topic, return key Q_AND_A.
            Action 3: If the question wants to get more information or an explanation about alerts for them, return key EXPLAIN_ALERTS.
            
            For your answer, ONLY return the correct task key, nothing else. Example, question = help me to create this missed alert for Hilti at url www.abc.com -> answer = MISSED_ALERT
            
            Here is the question you should analyse: ${question}
            
            Answer:`

        return this.llmGpt3.chatCompletion(prompt, "you are good at deriving tasks from answers", 0.3, "text")
    }


}