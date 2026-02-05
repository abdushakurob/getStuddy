'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, HelpCircle, Loader2, BookOpen, ArrowRight } from 'lucide-react';
import { sendMessageToDirector, handleActionIntent } from '@/lib/actions-director';
import { useResource } from '@/context/ResourceContext';

interface TranscriptItem {
    _id?: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    widgetType?: string;
    widgetData?: any;
    toolResults?: any[];
    suggestedActions?: Array<{
        label: string;
        intent: string;
        reason?: string;
        priority: 'primary' | 'secondary';
    }>;
}

interface SessionProgress {
    conceptsCovered: string[];
    estimatedTotal: number;
    isComplete: boolean;
}

interface AgentCanvasProps {
    sessionId: string;
    topicName?: string;
    initialTranscript?: TranscriptItem[];
    initialProgress?: SessionProgress;
}

export default function AgentCanvas({
    sessionId,
    topicName = "Study Session",
    initialTranscript = [],
    initialProgress = { conceptsCovered: [], estimatedTotal: 5, isComplete: false }
}: AgentCanvasProps) {
    const [transcript, setTranscript] = useState<TranscriptItem[]>(initialTranscript);
    const [input, setInput] = useState('');
    const [showInput, setShowInput] = useState(false);
    const [loading, setLoading] = useState(false);
    const [companionStatus, setCompanionStatus] = useState<string>("Ready when you are");
    const [progress, setProgress] = useState<SessionProgress>(initialProgress);
    const [navigationHint, setNavigationHint] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Get resource controls for navigation
    const { jumpToPage, seekTo } = useResource();

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [transcript]);

    const handleSendMessage = async (message: string) => {
        if (!message.trim()) return;

        setLoading(true);
        setCompanionStatus("Thinking...");
        setNavigationHint(null);

        // Optimistic UI update
        setTranscript(prev => [...prev, {
            role: 'user',
            content: message
        }]);
        setInput('');
        setShowInput(false);

        try {
            const response = await sendMessageToDirector(sessionId, message);

            setTranscript(prev => [...prev, {
                role: 'assistant',
                content: response.message,
                suggestedActions: response.suggestedActions,
                toolResults: response.toolResults
            }]);

            // Handle navigation commands from companion
            if (response.navigationCommands && response.navigationCommands.length > 0) {
                for (const nav of response.navigationCommands) {
                    if (nav.page) {
                        // PDF navigation
                        jumpToPage(nav.page);
                        setNavigationHint(`Showing page ${nav.page}: ${nav.context}`);
                    } else if (nav.timestamp) {
                        // Video/audio navigation - parse timestamp
                        const parts = nav.timestamp.split(':').map(Number);
                        let seconds = 0;
                        if (parts.length === 3) {
                            seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
                        } else if (parts.length === 2) {
                            seconds = parts[0] * 60 + parts[1];
                        } else {
                            seconds = parts[0];
                        }
                        seekTo(seconds);
                        setNavigationHint(`Jump to ${nav.timestamp}: ${nav.context}`);
                    }
                }
                // Clear hint after 5 seconds
                setTimeout(() => setNavigationHint(null), 5000);
            }

            // Update progress if returned
            if (response.progress) {
                setProgress(response.progress);
            }

            setCompanionStatus(response.progress?.isComplete ? "Great session!" : "I'm here if you need me");
        } catch (error) {
            console.error('Director error:', error);
            setCompanionStatus("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (intent: string) => {
        setLoading(true);
        setCompanionStatus("Processing...");
        setNavigationHint(null);

        try {
            const response = await handleActionIntent(sessionId, intent);

            setTranscript(prev => [...prev, {
                role: 'assistant',
                content: response.message,
                suggestedActions: response.suggestedActions,
                toolResults: response.toolResults
            }]);

            // Handle navigation commands
            if (response.navigationCommands && response.navigationCommands.length > 0) {
                for (const nav of response.navigationCommands) {
                    if (nav.page) {
                        jumpToPage(nav.page);
                        setNavigationHint(`Showing page ${nav.page}: ${nav.context}`);
                    } else if (nav.timestamp) {
                        const parts = nav.timestamp.split(':').map(Number);
                        let seconds = 0;
                        if (parts.length === 3) {
                            seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
                        } else if (parts.length === 2) {
                            seconds = parts[0] * 60 + parts[1];
                        } else {
                            seconds = parts[0];
                        }
                        seekTo(seconds);
                        setNavigationHint(`Jump to ${nav.timestamp}: ${nav.context}`);
                    }
                }
                setTimeout(() => setNavigationHint(null), 5000);
            }

            // Update progress if returned
            if (response.progress) {
                setProgress(response.progress);
            }

            setCompanionStatus(response.progress?.isComplete ? "Great session!" : "I'm here if you need me");
        } catch (error) {
            console.error('Action error:', error);
            setCompanionStatus("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const renderMessage = (item: TranscriptItem, index: number) => {
        if (item.role === 'user') {
            return (
                <div key={index} className="flex justify-end">
                    <div className="bg-gray-100 rounded-2xl px-4 py-3 max-w-[80%]">
                        <p className="text-sm text-gray-800">{item.content}</p>
                    </div>
                </div>
            );
        }

        return (
            <div key={index} className="space-y-3">
                <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4C8233] to-[#2F4F2F] flex items-center justify-center shrink-0">
                            <Sparkles size={16} className="text-white" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-gray-700 leading-relaxed">{item.content}</p>
                        </div>
                    </div>

                    {/* Dynamic AI-Generated Actions */}
                    {item.suggestedActions && item.suggestedActions.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {item.suggestedActions.map((action, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleAction(action.intent)}
                                    disabled={loading}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50 ${action.priority === 'primary'
                                        ? 'bg-[#4C8233] hover:bg-[#2F4F2F] text-white'
                                        : 'bg-gray-50 hover:bg-[#A3B18A]/10 border border-gray-200 hover:border-[#84A98C] text-gray-700'
                                        }`}
                                >
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Plan Adjustment Cards */}
                {item.toolResults?.map((result: any, idx: number) => {
                    if (result?.type === 'plan_adjustment') {
                        return (
                            <PlanAdjustmentCard
                                key={`adjustment-${idx}`}
                                sessionId={sessionId}
                                adjustment={result}
                            />
                        );
                    }
                    return null;
                })}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-white to-gray-50 relative">

            {/* Session Header */}
            <div className="p-6 border-b border-gray-100 bg-white shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg">{topicName}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {progress.isComplete ? "Session complete!" : companionStatus}
                        </p>
                    </div>
                    {(() => {
                        const total = progress.estimatedTotal || 1; // Prevent division by zero
                        const progressPercent = Math.min(
                            Math.round((progress.conceptsCovered.length / total) * 100),
                            100
                        );
                        const circumference = 2 * Math.PI * 20; // r=20
                        const offset = circumference - (progressPercent / 100) * circumference;

                        return (
                            <div className="relative w-12 h-12">
                                <svg className="transform -rotate-90 w-12 h-12">
                                    <circle cx="24" cy="24" r="20" stroke="#e5e7eb" strokeWidth="4" fill="none" />
                                    <circle
                                        cx="24" cy="24" r="20"
                                        stroke={progress.isComplete ? "#4C8233" : "#84A98C"}
                                        strokeWidth="4"
                                        fill="none"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={offset}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#4C8233]">
                                    {progressPercent}%
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* Navigation Hint Banner */}
            {navigationHint && (
                <div className="mx-6 mb-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2 animate-in slide-in-from-top duration-300">
                    <BookOpen size={16} className="text-blue-600" />
                    <span className="text-sm text-blue-700 font-medium">{navigationHint}</span>
                </div>
            )}

            {/* Transcript - Scrollable */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
                {transcript.map(renderMessage)}
                {loading && (
                    <div className="flex items-center gap-2 text-gray-500">
                        <Loader2 size={16} className="animate-spin" />
                        <span className="text-sm">{companionStatus}</span>
                    </div>
                )}
            </div>

            {/* Companion Presence & Input */}
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

                {/* Input Area */}
                {showInput ? (
                    <div className="flex gap-2">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(input)}
                            placeholder="Ask me anything..."
                            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#4C8233] focus:bg-white transition-all"
                            autoFocus
                        />
                        <button
                            onClick={() => handleSendMessage(input)}
                            disabled={!input.trim() || loading}
                            className="px-6 py-3 bg-[#4C8233] hover:bg-[#2F4F2F] text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                        >
                            Send
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowInput(true)}
                        className="w-full py-3 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors flex items-center justify-center gap-2 border border-gray-200 rounded-xl hover:bg-gray-50"
                    >
                        <HelpCircle size={16} />
                        <span>Ask something or share your thoughts</span>
                    </button>
                )}
            </div>
        </div>
    );
}
