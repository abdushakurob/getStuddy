'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Zap, HelpCircle, CheckCircle, ArrowRight, Lightbulb } from 'lucide-react';

interface CanvasItem {
    id: string;
    role: 'user' | 'assistant' | 'system';
    type: 'concept' | 'check' | 'note' | 'quiz' | 'flashcard';
    content: any;
    timestamp: string;
}

export default function AgentCanvas({ sessionId, initialTranscript = [] }: { sessionId: string, initialTranscript?: any[] }) {
    const [items, setItems] = useState<CanvasItem[]>([
        {
            id: 'init',
            role: 'assistant',
            type: 'concept',
            content: {
                title: "Lists & Tuples",
                body: "Let's start with the fundamentals. Lists are ordered collections that can change, while tuples are immutable.",
                action: "Ready to dive in?"
            },
            timestamp: new Date().toISOString()
        },
        ...initialTranscript
    ]);
    const [companionStatus, setCompanionStatus] = useState<string>("Ready when you are");
    const [showInput, setShowInput] = useState(false);
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [items]);

    const handleAction = (action: string) => {
        setCompanionStatus("Thinking...");

        setTimeout(() => {
            const responses: Record<string, CanvasItem> = {
                'explain': {
                    id: Date.now().toString(),
                    role: 'assistant',
                    type: 'concept',
                    content: {
                        title: "Here's how it works",
                        body: "Think of a list like a shopping cart - you can add, remove, or rearrange items. A tuple is like a sealed package - once created, it stays that way.",
                        action: "Make sense?"
                    },
                    timestamp: new Date().toISOString()
                },
                'example': {
                    id: Date.now().toString(),
                    role: 'assistant',
                    type: 'concept',
                    content: {
                        title: "Let me show you",
                        body: "my_list = [1, 2, 3]\nmy_list.append(4)  # Works!\n\nmy_tuple = (1, 2, 3)\nmy_tuple.append(4)  # Error!",
                        action: "Try it yourself"
                    },
                    timestamp: new Date().toISOString()
                },
                'quiz': {
                    id: Date.now().toString(),
                    role: 'assistant',
                    type: 'check',
                    content: {
                        question: "Which one can you modify after creation?",
                        options: ["List", "Tuple", "Both", "Neither"]
                    },
                    timestamp: new Date().toISOString()
                }
            };

            setItems(prev => [...prev, responses[action] || responses['explain']]);
            setCompanionStatus("I'm here if you need me");
        }, 800);
    };

    const renderWidget = (item: CanvasItem) => {
        if (item.type === 'concept') {
            return (
                <div key={item.id} className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-[#A3B18A]/20 flex items-center justify-center shrink-0">
                            <Lightbulb size={16} className="text-[#4C8233]" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-gray-900 mb-2">{item.content.title}</h4>
                            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap font-mono">{item.content.body}</p>
                        </div>
                    </div>
                    {item.content.action && (
                        <button
                            onClick={() => handleAction('next')}
                            className="mt-4 w-full py-2 bg-gray-50 hover:bg-[#A3B18A]/10 text-gray-700 hover:text-[#4C8233] rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <span>{item.content.action}</span>
                            <ArrowRight size={14} />
                        </button>
                    )}
                </div>
            );
        }

        if (item.type === 'check') {
            return (
                <div key={item.id} className="bg-gradient-to-br from-[#84A98C]/10 to-[#A3B18A]/10 rounded-[24px] p-6 border border-[#84A98C]/20">
                    <div className="flex items-center gap-2 mb-4">
                        <Zap size={18} className="text-[#4C8233]" />
                        <h4 className="font-bold text-[#2F4F2F]">Quick Check</h4>
                    </div>
                    <p className="text-gray-800 font-medium mb-4">{item.content.question}</p>
                    <div className="space-y-2">
                        {item.content.options.map((opt: string, idx: number) => (
                            <button
                                key={idx}
                                onClick={() => handleAction('answer')}
                                className="w-full p-3 bg-white hover:bg-[#A3B18A]/10 border border-gray-200 hover:border-[#4C8233] rounded-xl text-left text-sm font-medium transition-all"
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-white to-gray-50 relative">

            {/* Active Context Header */}
            <div className="p-6 border-b border-gray-100 bg-white shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg">Lists & Tuples</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Chapter 3 • Python Basics</p>
                    </div>
                    <div className="relative w-12 h-12">
                        <svg className="transform -rotate-90 w-12 h-12">
                            <circle cx="24" cy="24" r="20" stroke="#e5e7eb" strokeWidth="4" fill="none" />
                            <circle cx="24" cy="24" r="20" stroke="#4C8233" strokeWidth="4" fill="none"
                                strokeDasharray="125.6" strokeDashoffset="75" strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#4C8233]">
                            40%
                        </div>
                    </div>
                </div>
            </div>

            {/* Companion Workspace - Scrollable */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
                {items.map(renderWidget)}
            </div>

            {/* Companion Presence & Actions */}
            <div className="p-6 bg-white border-t border-gray-100 shrink-0">
                {/* Companion Avatar & Status */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4C8233] to-[#2F4F2F] flex items-center justify-center shadow-lg">
                            <Sparkles size={20} className="text-white" />
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#A3B18A] rounded-full border-2 border-white" />
                    </div>
                    <div className="flex-1">
                        <p className="text-xs text-gray-500 font-medium">{companionStatus}</p>
                    </div>
                </div>

                {/* Action Bar */}
                {!showInput ? (
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => handleAction('explain')}
                            className="p-3 bg-gray-50 hover:bg-[#A3B18A]/10 border border-gray-200 hover:border-[#84A98C] rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
                        >
                            <Lightbulb size={16} />
                            <span>Explain this</span>
                        </button>
                        <button
                            onClick={() => handleAction('example')}
                            className="p-3 bg-gray-50 hover:bg-[#A3B18A]/10 border border-gray-200 hover:border-[#84A98C] rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
                        >
                            <Sparkles size={16} />
                            <span>Show example</span>
                        </button>
                        <button
                            onClick={() => handleAction('quiz')}
                            className="p-3 bg-gray-50 hover:bg-[#A3B18A]/10 border border-gray-200 hover:border-[#84A98C] rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
                        >
                            <Zap size={16} />
                            <span>Quiz me</span>
                        </button>
                        <button
                            onClick={() => handleAction('next')}
                            className="p-3 bg-[#4C8233] hover:bg-[#2F4F2F] text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                        >
                            <CheckCircle size={16} />
                            <span>I got it</span>
                        </button>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask me anything..."
                            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#4C8233] focus:bg-white transition-all"
                        />
                        <button
                            onClick={() => setShowInput(false)}
                            className="px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-xl font-medium transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                )}

                <button
                    onClick={() => setShowInput(!showInput)}
                    className="w-full mt-2 py-2 text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors flex items-center justify-center gap-1"
                >
                    <HelpCircle size={14} />
                    <span>{showInput ? 'Use quick actions' : 'Ask something specific'}</span>
                </button>
            </div>
        </div>
    );
}
