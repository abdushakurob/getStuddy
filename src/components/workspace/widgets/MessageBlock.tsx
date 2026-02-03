'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User } from 'lucide-react';

interface MessageBlockProps {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export default function MessageBlock({ role, content }: MessageBlockProps) {
    const isUser = role === 'user';

    return (
        <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''} mb-6`}>
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex shrink-0 items-center justify-center ${isUser ? 'bg-gray-200' : 'bg-green-100 text-green-700'}`}>
                {isUser ? <User size={14} /> : <Bot size={16} />}
            </div>

            {/* Bubble */}
            <div className={`
                max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed
                ${isUser
                    ? 'bg-gray-800 text-white rounded-tr-sm'
                    : 'bg-white border border-gray-100 shadow-sm text-gray-700 rounded-tl-sm'
                }
            `}>
                <div className={`prose prose-sm max-w-none break-words
                    ${isUser ? 'prose-invert' : 'prose-green'}
                `}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {content}
                    </ReactMarkdown>
                </div>
            </div>
        </div>
    );
}
