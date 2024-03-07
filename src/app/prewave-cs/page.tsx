'use client';

import * as React from 'react';
import {useState} from 'react';
import {TextField} from '@mui/material';
import Stack from '@mui/material/Stack';
import LoadingButton from "@mui/lab/LoadingButton";
import {MessageWithSources} from "@/domain/chat/MessageWithSources";
import {AxiosHttpClient} from "@/backend/http/AxiosHttpClient";
import {RagRequest} from "@/backend/llms/rag/RagRequest";
import {PrewaveRagSource} from "@/domain/prewave/PrewaveRagSource";
import {RagResponse} from "@/backend/llms/rag/RagResponse";
import {ChatColumn} from "@/components/chat/ChatColumn";

export default function PrewaveCSPage() {

    const httpClient = new AxiosHttpClient("http://localhost:3002/api", 300000)

    const [input, setInput] = useState<string>('')
    const [messages, setMessages] = useState<MessageWithSources[]>([])
    const [loading, setLoading] = useState<boolean>(false)

    const onSend = async () => {
        setLoading(true)
        const ragRequest = {input: input, scopeId: 'prewave-cs', previousResponses: []} as RagRequest<PrewaveRagSource>

        await httpClient
            .post<RagRequest<PrewaveRagSource>, RagResponse<PrewaveRagSource>>('rag', ragRequest)
            .then((response) => {

                const question = {
                    role: 'user',
                    text: input
                } as MessageWithSources

                const answer = {
                    role: 'bot',
                    text: response.output,
                    sources: response.references
                } as MessageWithSources

                const newMessages = [...messages, question, answer]
                setMessages(newMessages)
                setInput('')
            })
            .catch((error) => console.log(error))
        setLoading(false)
    }

    return (
        <Stack height={1} paddingY={2} paddingX={8}>
            <ChatColumn messages={messages}/>
            <Stack spacing={2} direction="row" paddingY={2}>
                <TextField
                    variant="outlined"
                    margin="normal"
                    fullWidth
                    id="input"
                    placeholder="Message CS Bot"
                    name="question"
                    multiline
                    value={input}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        setInput(event.target.value)
                    }}
                />
                <LoadingButton
                    loading={loading}
                    size="medium"
                    variant="contained"
                    color="primary"
                    onClick={onSend}
                >
                    Send
                </LoadingButton>
            </Stack>
        </Stack>
    );
}
