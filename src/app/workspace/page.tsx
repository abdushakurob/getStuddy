'use client';

import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import { Send, Bot, User, Paperclip, MoreHorizontal } from 'lucide-react';
import { useState, useRef, useEffect } from "react";

interface Message {
    role: 'user' | 'model';
    text: string;
}

export default function WorkspacePage() {
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', text: "Hello! I've analyzed your **Systems Design** syllabus. We have 3 main topics to cover today. Ready to start?" }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input;
        setInput("");
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsLoading(true);

        try {
            const history = messages.map(m => ({
                role: m.role,
                parts: [{ text: m.text }]
            }));

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg,
                    history: history
                }),
            });

            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let done = false;
            let aiMsg = "";

            setMessages(prev => [...prev, { role: 'model', text: "" }]);

            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                const chunkValue = decoder.decode(value);
                aiMsg += chunkValue;

                setMessages(prev => {
                    const newMsgs = [...prev];
                    newMsgs[newMsgs.length - 1].text = aiMsg;
                    return newMsgs;
                });
            }

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'model', text: "Connection lost. Try again, Studdy." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <WorkspaceLayout>
            <div className="flex h-full">

                {/* --- CHAT COLUMN (Left) --- */}
                <div className="flex-1 flex flex-col relative border-r border-gray-100">

                    {/* Header */}
                    <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                        <div>
                            <h2 className="font-bold text-lg">Course Chat</h2>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500" />
                                <span className="text-xs text-gray-500 font-medium">Studdy is Online</span>
                            </div>
                        </div>
                        <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                            <MoreHorizontal size={20} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex gap-4 max-w-2xl ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-gray-100 ${msg.role === 'model' ? 'bg-white' : 'bg-indigo-600 text-white'
                                    }`}>
                                    {msg.role === 'model' ? <Bot size={20} className="text-indigo-600" /> : <User size={20} />}
                                </div>

                                <div className={`space-y-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                                    <div className={`text-xs font-bold text-gray-400 mb-1 ${msg.role === 'user' ? 'mr-1' : 'ml-1'}`}>
                                        {msg.role === 'model' ? 'Studdy AI' : 'You'}
                                    </div>
                                    <div className={`p-5 rounded-2xl shadow-sm leading-relaxed text-[15px] ${msg.role === 'model'
                                            ? 'bg-gray-50 text-gray-800 rounded-tl-none border border-gray-100'
                                            : 'bg-black text-white rounded-tr-none'
                                        }`}>
                                        <p className="whitespace-pre-wrap">{msg.text}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center shrink-0 shadow-sm">
                                    <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                </div>
                                <div className="bg-gray-50 px-4 py-3 rounded-2xl rounded-tl-none text-gray-400 text-sm italic font-medium">
                                    Thinking...
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-6 bg-white border-t border-gray-100">
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-2 flex items-center gap-2 pr-2 shadow-inner">
                            <button className="p-3 text-gray-400 hover:text-indigo-600 hover:bg-gray-200 rounded-xl transition-colors">
                                <Paperclip size={20} />
                            </button>
                            <input
                                type="text"
                                className="flex-1 bg-transparent border-none outline-none text-gray-800 placeholder-gray-400 font-medium ml-2"
                                placeholder="Type your message..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={isLoading}
                                className="p-3 bg-black text-white rounded-xl shadow-lg shadow-gray-300 hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
                            >
                                <Send size={18} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- CONTEXT COLUMN (Right - Placeholder for PDF) --- */}
                <div className="w-[450px] bg-gray-50 border-l border-gray-100 hidden xl:flex flex-col">
                    <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100 bg-white/50 backdrop-blur-sm">
                        <h2 className="font-bold text-lg">Context Source</h2>
                    </div>
                    <div className="flex-1 flex items-center justify-center text-gray-400 p-8 text-center">
                        <div>
                            <div className="w-24 h-32 bg-white border border-gray-200 rounded-lg shadow-sm mx-auto mb-4 flex items-center justify-center">
                                <span className="font-bold text-xs">PDF</span>
                            </div>
                            <p className="font-medium text-sm">Select a resource to view it here side-by-side.</p>
                        </div>
                    </div>
                </div>

            </div>
        </WorkspaceLayout>
    );
}
