import {NextResponse} from 'next/server';
import {OpenAILLM} from "@/backend/llms/OpenAILLM";

export async function GET(req: Request) {

    const c = OpenAILLM.fromEnv()
   const r = await c.imageToTextB64WithResize("https://i.natgeofe.com/n/548467d8-c5f1-4551-9f58-6817a8d2c45e/NationalGeographic_2572187_4x3.jpg").then(a => {
        console.log("aaaaaa")
        console.log(a)
    })

    return NextResponse.json({"message": "dd"})
}
