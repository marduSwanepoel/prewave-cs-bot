'use client';

import * as React from 'react';
import {ReactNode} from 'react';
import {Typography} from '@mui/material';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';

export interface IMessageBase {
    role: 'user' | 'bot'
    text: string
    meta?: ReactNode
}

export const MessageBase = ({role, text, meta}: IMessageBase) => {
    const color = role === 'user' ? '#9B59B6' : '#465FEB'

    return (
        <Stack width={1} spacing={2} direction="row">
            <Avatar sx={{width: 34, height: 34, bgcolor: color}}>
                {role == 'user' ? <Typography>U</Typography> : < SmartToyOutlinedIcon fontSize="medium"/>}
            </Avatar>

            <Stack direction="column">
                <Typography variant="body1" color="text.secondary" fontWeight={'bold'}>
                    {role == 'user' ? "You" : "CS Bot"}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    {text}
                </Typography>

                {role === 'bot' && (
                    <Stack marginTop={2}>
                        <Typography marginBottom={1} variant="body2" color="text.secondary">Sources: </Typography>
                        {meta}
                    </Stack>
                )}

            </Stack>
        </Stack>
    );
}
