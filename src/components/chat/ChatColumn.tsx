'use client';

import * as React from 'react';
import Stack from '@mui/material/Stack';
import {Typography} from "@mui/material";
import {MessageWithSources} from "@/domain/chat/MessageWithSources";
import {ResponseMessage} from "@/components/chat/ResponseMessage";

export interface IChatColumn {
    messages: MessageWithSources[];
    noContentMessage?: string;
}

export const ChatColumn = ({messages, noContentMessage}: IChatColumn) => {

    return (
        <Stack
            id={"chat-culumn"}
            spacing={4}
            borderRadius={2}
            height={1}
            paddingX={2}
            paddingTop={2}
            direction="column"
            style={{backgroundColor: "#F8FBFC", overflowY: 'auto'}}
        >
            {messages && messages.length > 0 ? messages.map((message, index) => {
                return (
                    <ResponseMessage key={index} message={message}/>
                )
            }) : (<Typography variant="body1">Chat is empty</Typography>)}
        </Stack>
    )
}
