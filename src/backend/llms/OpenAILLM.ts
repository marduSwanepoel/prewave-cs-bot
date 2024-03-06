import OpenAI from 'openai'
import logger from 'pino'
import {ChatCompletionMessageParam} from "openai/resources/chat/completions";


//todo abstract with interface
export class OpenAILLM {

    openAIClient: OpenAI
    model: string
    private log = logger()

    constructor(APIKey: string, model?: string) {
        this.model = model ?? 'gpt-3.5-turbo'
        this.openAIClient = new OpenAI({apiKey: APIKey})
    }

    static fromEnv(model?: 'gpt-4' | 'gpt-3.5-turbo'): OpenAILLM {
        const {OPENAI_API_KEY} = process.env
        if (!OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY environment variable not found')
        }
        return new OpenAILLM(OPENAI_API_KEY, model)
    }

    //todo change to accept role and content seperately
    async chatCompletion(content: string, roleContext?: string, temperature?: number, response_format?: 'text' | 'json_object'): Promise<string> {
        const messages = [
            ...(!!roleContext ? [{role: 'system', content: roleContext} as ChatCompletionMessageParam] : []),
            {role: 'user', content: content} as ChatCompletionMessageParam
        ]

        const completionResponse = await this.openAIClient.chat.completions.create({
            model: this.model,
            messages: messages,
            ...(temperature && {temperature: temperature}),
            // ...(response_format && {response_format: {type: response_format}}) //todo not yet available in GPT-4
        })

        const response = completionResponse.choices[0]
        if (response == null) {
            return Promise.reject("No response from LLM")
        } else {
            // @ts-ignore
            return Promise.resolve(response.message.content)
        }
    }

    async chatCompletionAsObject<A>(content: string, roleContext?: string, temperature?: number): Promise<A> {

        const response = await this.chatCompletion(content, roleContext, temperature, 'json_object')
        try {
            const responseBody = JSON.parse(response) as A
            return Promise.resolve(responseBody)
        } catch (error) {
            this.log.error("Failed to parse LLM response JSON from response: " + response)
            return Promise.reject("Failed to parse LLM response JSON")
        }
    }

    async imageToText(imageUrl: string): Promise<string> {
        const result = await this.openAIClient.chat.completions.create({
            model: "gpt-4-vision-preview",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Given the following screenshot of a web interface, generate a description of what is going on. Explain in maximum 2 sentences." },
                        {
                            type: "image_url",
                            image_url: {
                                "url": "https://slack-files.com/T2FK78T8T-F06NM3Y7S0Z-ad2e910d9a",
                            },
                        },
                    ],
                },
            ],
        });


        const response = result.choices[0]
        if (response == null) {
            return Promise.reject("No response from LLM")
        } else {
            // @ts-ignore
            return Promise.resolve(response.message.content)
        }
    }

}