'use client';

import { useState, useEffect, useRef } from 'react';
import { getChatHistory, sendMessage } from '@/lib/actions-chat';
import { Bot, User as UserIcon, Send, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import PlanSummaryCard from './PlanSummaryCard';
import { useRouter } from 'next/navigation';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    planData?: any;
}

interface PlanData {
    phase: string;
    goal: string;
    nextTask: { topic: string; date: string };
    startUrl: string;
}

export default function NegotiationChat({ courseId, existingPlan }: { courseId: string; existingPlan?: PlanData | null }) {
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activePlan, setActivePlan] = useState<PlanData | null>(existingPlan || null);
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

        // Hide plan card while adjusting (until new plan is locked)
        setActivePlan(null);

        try {
            const response = await sendMessage(courseId, userMsg.content);

            const newAiMsg: Message = {
                ...response.aiMessage as Message,
                planData: response.committedPlan
            };

            setMessages(prev => [
                ...prev.filter(m => m.id !== tempId),
                response.userMessage as Message,
                newAiMsg
            ]);

            // Update activePlan if a new plan was committed
            if (response.committedPlan) {
                setActivePlan(response.committedPlan);
            }

        } catch (error) {
            console.error(error);
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
                        <h2 className="font-black text-[#1F2937] text-lg">Studdy</h2>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Your Study Companion</p>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F9FAFB]">

                {messages.length === 0 && !activePlan && (
                    <div className="flex flex-col items-center justify-center h-full text-center opacity-50 px-10">
                        <Bot size={48} className="text-[#4C8233] mb-4" />
                        <p className="font-bold text-gray-400">
                            "Hey! I've looked through your materials. Ready to plan this out together?"
                        </p>
                    </div>
                )}

                {messages.map((msg) => (
                    <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`} key={msg.id}>

                        <div className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            {/* Avatar */}
                            <div className={`w-8 h-8 rounded-full flex shrink-0 items-center justify-center ${msg.role === 'user' ? 'bg-gray-200' : 'bg-[#E3F2DF] text-[#4C8233]'}`}>
                                {msg.role === 'user' ? <UserIcon size={14} /> : <Bot size={16} />}
                            </div>

                            {/* Bubble */}
                            <div className={`
                                max-w-[85%] p-4 rounded-3xl text-sm font-medium leading-relaxed
                                ${msg.role === 'user'
                                    ? 'bg-[#1F2937] text-white rounded-tr-sm'
                                    : 'bg-white border border-gray-100 shadow-sm text-gray-700 rounded-tl-sm'
                                }
                            `}>
                                <div className={`prose prose-sm max-w-none break-words
                                    ${msg.role === 'user'
                                        ? 'prose-invert prose-p:text-white prose-headings:text-white'
                                        : 'prose-headings:text-[#1F2937] prose-p:text-gray-600 prose-strong:text-[#4C8233]'
                                    }
                                `}>
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            a: ({ node, ...props }) => <a {...props} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer" />,
                                            // Table styles
                                            table: ({ node, ...props }) => (
                                                <div className="overflow-x-auto my-4 rounded-xl border border-gray-200">
                                                    <table {...props} className="w-full text-sm text-left" />
                                                </div>
                                            ),
                                            thead: ({ node, ...props }) => <thead {...props} className="bg-gray-50 text-xs uppercase text-gray-500 font-bold" />,
                                            th: ({ node, ...props }) => <th {...props} className="px-4 py-3 border-b border-gray-100" />,
                                            td: ({ node, ...props }) => <td {...props} className="px-4 py-3 border-b border-gray-100 last:border-0" />,
                                        }}
                                    >
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </div>

                        {/* Plan card is shown at the bottom via activePlan, not inline */}

                    </div>
                ))}

                {/* Typing Indicator Bubble */}
                {isLoading && (
                    <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full flex shrink-0 items-center justify-center bg-[#E3F2DF] text-[#4C8233]">
                            <Bot size={16} />
                        </div>
                        <div className="bg-white border border-gray-100 shadow-sm rounded-3xl rounded-tl-sm px-5 py-4">
                            <div className="flex gap-1.5">
                                <div className="w-2 h-2 bg-[#4C8233] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-[#4C8233] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-[#4C8233] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Show plan card as last message from agent */}
                {activePlan && (
                    <div className="flex flex-col items-start">
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full flex shrink-0 items-center justify-center bg-[#E3F2DF] text-[#4C8233]">
                                <Bot size={16} />
                            </div>
                            <div className="max-w-[85%]">
                                <PlanSummaryCard plan={activePlan} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white border-t border-gray-100 z-10">
                <div className="relative flex items-center shadow-lg shadow-gray-100 rounded-full bg-white border border-gray-200 overflow-hidden transition-all focus-within:ring-2 ring-[#4C8233]/20 ring-offset-2">
                    <input
                        className="flex-1 p-4 pl-6 outline-none text-gray-700 placeholder:text-gray-400 font-medium"
                        placeholder="Type your strategy..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className={`
                            p-3 mr-2 rounded-full transition-all duration-300
                            ${!input.trim()
                                ? 'bg-gray-100 text-gray-300'
                                : 'bg-[#1F2937] text-white hover:bg-black hover:scale-110 shadow-md'
                            }
                        `}
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Send size={20} />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
