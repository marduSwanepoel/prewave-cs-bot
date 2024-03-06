'use client';

import * as React from 'react';
import {Typography} from '@mui/material';
import Paper from '@mui/material/Paper';
import Markdown from 'react-markdown'
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import {MessageWithSources} from "@/domain/chat/MessageWithSources";
import {MessageBase} from "@/components/chat/MessageBase";

export interface IResponseMessage {
    message: MessageWithSources
}

export const ResponseMessage = ({message}: IResponseMessage) => {
    const {role, text, sources} = message

    const metaInfo = (
        <Stack direction="row" spacing={2} style={{
            overflow: 'auto',
            padding: 1
        }}>
            {sources && sources.map((reference, index) => {
                return (
                    <Paper
                        id={reference.id}
                        elevation={1}
                        style={{padding: 10, width: 500, backgroundColor: "#ffffff"}}
                    >
                        <Stack direction={"row"} justifyContent="space-between">
                            <Stack direction={"row"}>
                                <Avatar sx={{
                                    width: 15,
                                    height: 15,
                                    fontSize: 12,
                                    marginRight: 0.5,
                                    marginTop: 0.7
                                }}>{index + 1}</Avatar>
                                <Typography variant="subtitle1" component="div">
                                    {reference.sourceName}
                                </Typography>
                            </Stack>
                            <a href={reference.url} target="_blank" rel="noopener noreferrer">
                                <OpenInNewOutlinedIcon
                                    sx={{width: 15, height: 15, fontSize: 12, marginRight: 0.5, marginTop: 0.7}}/>
                            </a>
                        </Stack>

                        <Divider style={{marginTop: 8}} light/>
                        <Stack style={{overflow: "auto", height: 200}}>
                            <Markdown>{reference.content}</Markdown>
                        </Stack>
                    </Paper>
                )
            })}
        </Stack>
    )

    return (
        <MessageBase
            // @ts-ignore
            role={role}
            text={text}
            meta={metaInfo}
        />
    )
}
