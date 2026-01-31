'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, User as UserIcon, Bot, Loader2, Sparkles } from 'lucide-react';
import { sendMessage, getChatHistory } from '@/lib/actions-chat';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

export default function NegotiationChat({ courseId }: { courseId: string }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Initial Load
    useEffect(() => {
        const loadHistory = async () => {
            const history = await getChatHistory(courseId);
            setMessages(history);
        };
        loadHistory();
    }, [courseId]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const tempId = Date.now().toString();
        const userMsg: Message = { id: tempId, role: 'user', content: input };

        // Optimistic Update
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await sendMessage(courseId, userMsg.content);

            // Replace optimistic user msg with real one + add AI response
            setMessages(prev => [
                ...prev.filter(m => m.id !== tempId),
                response.userMessage as Message,
                response.aiMessage as Message
            ]);
        } catch (error) {
            console.error(error);
            // TODO: Error Toast
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden relative">

            {/* Header / Persona */}
            <div className="p-6 border-b border-gray-100 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#4C8233] to-[#7BC65F] rounded-full flex items-center justify-center shadow-lg shadow-[#4C8233]/20">
                        <Sparkles size={24} className="text-white" />
                    </div>
                    <div>
                        <h2 className="font-black text-[#1F2937] text-lg">Studdy Companion</h2>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Planning Phase</p>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F9FAFB]">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center opacity-50 px-10">
                        <Bot size={48} className="text-[#4C8233] mb-4" />
                        <p className="font-bold text-gray-400">
                            "Hello! I've analyzed your files. Ready to design a study plan?"
                        </p>
                    </div>
                )}

                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full flex shrink-0 items-center justify-center ${msg.role === 'user' ? 'bg-gray-200' : 'bg-[#E3F2DF] text-[#4C8233]'}`}>
                            {msg.role === 'user' ? <UserIcon size={14} /> : <Bot size={16} />}
                        </div>

                        {/* Bubble */}
                        <div className={`
                            max-w-[70%] p-4 rounded-3xl text-sm font-medium leading-relaxed
                            ${msg.role === 'user'
                                ? 'bg-[#1F2937] text-white rounded-tr-sm'
                                : 'bg-white border border-gray-100 shadow-sm text-gray-700 rounded-tl-sm'
                            }
                        `}>
                            {msg.content}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-[#E3F2DF] text-[#4C8233] flex shrink-0 items-center justify-center">
                            <Bot size={16} />
                        </div>
                        <div className="bg-white border border-gray-100 p-4 rounded-3xl rounded-tl-sm shadow-sm flex items-center gap-2">
                            <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" />
                            <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                            <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100">
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-3xl p-2 pl-6 focus-within:border-[#4C8233] focus-within:ring-2 ring-[#4C8233]/10 transition-all shadow-inner"
                >
                    <input
                        className="flex-1 bg-transparent border-none outline-none text-sm font-semibold text-gray-700 placeholder:text-gray-400"
                        placeholder="Discuss your study plan..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="w-10 h-10 bg-[#1F2937] text-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all shadow-lg shadow-gray-900/20"
                    >
                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                </form>
            </div>
        </div>
    );
}
