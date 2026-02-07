'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import {
    Send,
    Bot,
    User,
    Sparkles,
    BookOpen,
    ArrowRight,
    CheckCircle2,
    Loader2,
    PlayCircle,
    Play,
    FileText,
    MessageSquare,
    Map as MapIcon,
    StickyNote,
    Clock
} from 'lucide-react';
import { sendMessageToDirector, handleActionIntent } from '@/lib/actions-director';
import { useResource } from '@/context/ResourceContext';
import PlanAdjustmentCard from './PlanAdjustmentCard';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface TranscriptItem {
    role: 'user' | 'assistant' | 'system';
    content: string;
    suggestedActions?: { label: string; intent: string; priority?: 'primary' | 'secondary' }[];
    toolResults?: any[]; // Keep flexible for now
    navigationCommands?: any[];
    progress?: SessionProgress;
}

interface SessionProgress {
    conceptsCovered: any[];
    estimatedTotal: number;
    isComplete: boolean;
}

interface Milestone {
    label: string;
    status: 'pending' | 'active' | 'completed';
    reasoning?: string;
}

interface ParkingItem {
    topic: string;
    question: string;
    context?: string;
}

interface AgentCanvasProps {
    sessionId: string;
    topicName?: string;
    initialTranscript?: TranscriptItem[];
    initialProgress?: SessionProgress;
    initialMilestones?: Milestone[];
    initialParkingLot?: ParkingItem[];
}

export default function AgentCanvas({
    sessionId,
    topicName = "Study Session",
    initialTranscript = [],
    initialProgress = { conceptsCovered: [], estimatedTotal: 5, isComplete: false },
    initialMilestones = [],
    initialParkingLot = []
}: AgentCanvasProps) {
    const router = useRouter();
    const [transcript, setTranscript] = useState<TranscriptItem[]>(initialTranscript || []);
    const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones || []);
    const [parkingLot, setParkingLot] = useState<ParkingItem[]>(initialParkingLot || []);

    // Tab State: 'chat' or 'plan'
    const [activeTab, setActiveTab] = useState<'chat' | 'plan'>('chat');

    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [companionStatus, setCompanionStatus] = useState<string>("Ready when you are");
    const [progress, setProgress] = useState<SessionProgress>(initialProgress);
    const [navigationHint, setNavigationHint] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Get resource controls for navigation
    const { jumpToPage, seekTo, jumpToLabel, switchResource, currentResource, availableResources } = useResource();

    useEffect(() => {
        if (activeTab === 'chat' && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [transcript, activeTab]);

    // Update Local State from Tool Results
    const processToolResults = (results: any[]) => {
        if (!results) return;

        for (const res of results) {
            if (res.type === 'milestone_update') {
                setMilestones(prev => prev.map(m =>
                    m.label === res.milestoneLabel
                        ? { ...m, status: res.newStatus }
                        : m
                ));
            } else if (res.type === 'parking_update' && res.action === 'add') {
                setParkingLot(prev => [...prev, {
                    topic: res.topic,
                    question: res.question,
                    context: res.context
                }]);
            }
        }
    };

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

        try {
            const response = await sendMessageToDirector(sessionId, message, 'user', currentResource?._id);

            setTranscript(prev => [...prev, {
                role: 'assistant',
                content: response.message,
                suggestedActions: response.suggestedActions,
                toolResults: response.toolResults
            }]);

            // Handle real-time updates for Milestones/Parking
            if (response.toolResults) {
                processToolResults(response.toolResults);
            }

            // Handle navigation commands from companion
            if (response.navigationCommands && response.navigationCommands.length > 0) {
                for (const nav of response.navigationCommands) {
                    // Switch resource if needed (Must find object first)
                    if (nav.resourceId) {
                        const targetRes = availableResources.find(r => r._id === nav.resourceId || r._id?.toString() === nav.resourceId);
                        if (targetRes && targetRes._id !== currentResource?._id) {
                            switchResource(targetRes.id);
                            setNavigationHint(`Switching to ${targetRes.title}...`);
                            // If switching, give it a moment before seeking (if also seeking)
                            // Ideally we queue the seek, but for now let's delay
                            if (nav.timestamp || nav.page) {
                                await new Promise(r => setTimeout(r, 1000));
                            }
                        }
                    }

                    if (nav.page) {
                        // PDF navigation - Try label jump (smart)
                        jumpToLabel(nav.page.toString());
                        setNavigationHint(`Showing page ${nav.page}${nav.context ? `: ${nav.context}` : ''}`);
                    } else if (nav.timestamp) {
                        // Video/audio navigation - parse timestamp
                        let seconds = 0;
                        // Handle potential formats: "1:30", "90", "1.5" (min?), "0.43" ??
                        // If it's a string with ":", parse standard
                        if (nav.timestamp.toString().includes(':')) {
                            const parts = nav.timestamp.split(':').map(Number);
                            if (parts.length === 3) seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
                            else if (parts.length === 2) seconds = parts[0] * 60 + parts[1];
                        } else {
                            // If raw number/string
                            const val = parseFloat(nav.timestamp);
                            // valid seconds usually
                            seconds = val;
                        }

                        seekTo(seconds);
                        setNavigationHint(`Jump to ${nav.timestamp}${nav.context ? `: ${nav.context}` : ''}`);
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

    const handleAction = async (label: string, intent: string) => {
        setLoading(true);
        setCompanionStatus("Processing...");
        setNavigationHint(null);

        // 1. Optimistic User Message & Remove Actions from Previous Message
        setTranscript(prev => {
            const newTranscript = [...prev];
            // Find the last assistant message and clear its actions
            const lastAssistantIndex = newTranscript.findLastIndex(t => t.role === 'assistant');
            if (lastAssistantIndex !== -1) {
                newTranscript[lastAssistantIndex] = {
                    ...newTranscript[lastAssistantIndex],
                    suggestedActions: [] // Hide buttons
                };
            }
            // Add user choice
            newTranscript.push({
                role: 'user',
                content: label
            });
            return newTranscript;
        });

        try {
            const response = await handleActionIntent(sessionId, intent);

            setTranscript(prev => [...prev, {
                role: 'assistant',
                content: response.message,
                suggestedActions: response.suggestedActions,
                toolResults: response.toolResults
            }]);

            // Handle real-time updates for Milestones/Parking
            if (response.toolResults) {
                processToolResults(response.toolResults);
            }

            // Handle navigation commands
            if (response.navigationCommands && response.navigationCommands.length > 0) {
                for (const nav of response.navigationCommands) {
                    // Switch resource if needed
                    if (nav.resourceId) {
                        switchResource(nav.resourceId);
                    }

                    if (nav.page) {
                        jumpToLabel(nav.page.toString());
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
        } catch (error: any) {
            console.error('Action error:', error);
            if (error.message?.includes('Unauthorized') || error.message?.includes('Session not found')) {
                setCompanionStatus('Session expired. Redirecting...');
                router.push('/login');
                return;
            }
            setCompanionStatus(`Error: ${error.message || "Something went wrong"}`);
        } finally {
            setLoading(false);
        }
    };

    const renderMessage = (item: TranscriptItem, index: number) => {
        if (item.role === 'user') {
            return (
                <div key={index} className="flex justify-end">
                    <div className="bg-gray-100 rounded-2xl px-4 py-3 max-w-[80%] text-sm text-gray-800">
                        {item.content}
                    </div>
                </div>
            );
        }

        if (item.role === 'system') return null;

        // Check for "Silent" tool actions (e.g. purely updating state without text)
        const isToolOnly = !item.content && item.toolResults && item.toolResults.length > 0;

        if (isToolOnly) {
            return (
                <div key={index} className="flex flex-col gap-2 items-center py-2 animate-in fade-in slide-in-from-bottom-2">
                    {item.toolResults?.map((res, idx: number) => {
                        if (res.type === 'milestone_update') {
                            return (
                                <div key={idx} className="flex items-center gap-2 text-xs text-gray-500 font-medium bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
                                    <CheckCircle2 size={12} className="text-[#4C8233]" />
                                    <span>{res.newStatus === 'completed' ? 'Completed' : 'Started'}: <strong className="text-gray-700">{res.milestoneLabel}</strong></span>
                                </div>
                            );
                        }
                        if (res.type === 'parking_update') {
                            return (
                                <div key={idx} className="flex items-center gap-2 text-xs text-gray-500 font-medium bg-yellow-50 px-3 py-1.5 rounded-full border border-yellow-100 shadow-sm">
                                    <StickyNote size={12} className="text-yellow-600" />
                                    <span>Parked thought: <strong className="text-yellow-800">{res.topic}</strong></span>
                                </div>
                            );
                        }
                        if (res.type === 'plan_adjustment') {
                            return <PlanAdjustmentCard key={idx} sessionId={sessionId} adjustment={res} />;
                        }
                        if (res.type === 'navigation') {
                            return (
                                <div key={idx} className="flex items-center gap-2 text-xs text-gray-500 font-medium bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 shadow-sm">
                                    <BookOpen size={12} className="text-blue-600" />
                                    <span>Navigating to <strong className="text-blue-800">{res.resourceId ? 'Resource' : (res.page ? `Page ${res.page}` : (res.timestamp ? `${res.timestamp}` : 'Location'))}</strong>...</span>
                                </div>
                            );
                        }
                        if (res.type === 'paths') {
                            return (
                                <div key={idx} className="flex flex-wrap gap-2 mt-2 justify-center w-full">
                                    {res.paths?.map((action: any, i: number) => (
                                        <button
                                            key={i}
                                            onClick={() => handleAction(action.suggestion, action.suggestion)}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all bg-[#E3F2DF] text-[#4C8233] hover:bg-[#4C8233] hover:text-white border border-[#4C8233]/20 shadow-sm`}
                                        >
                                            {action.suggestion}
                                        </button>
                                    ))}
                                </div>
                            );
                        }
                        return null;
                    })}
                </div>
            );
        }

        // Create maps for clickable links
        const timestampMap = new Map<string, string>();
        const pageMap = new Map<string, string>();

        if (item.toolResults) {
            item.toolResults.forEach((t: any) => {
                if (t.type === 'navigation' && t.resourceId) {
                    if (t.timestamp) timestampMap.set(t.timestamp, t.resourceId);
                    if (t.page) pageMap.set(t.page.toString(), t.resourceId);
                }
            });
        }

        // Fallback: Check for generic navigation tool if map lookup fails
        const navTool = item.toolResults?.find((t: any) => t.type === 'navigation');
        const fallbackResourceId = navTool?.resourceId;

        return (
            <div key={index} className="space-y-3">
                {item.content && (
                    <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4C8233] to-[#2F4F2F] flex items-center justify-center shrink-0">
                                <Sparkles size={16} className="text-white" />
                            </div>
                            <div className="flex-1 prose prose-sm max-w-none prose-p:text-gray-700 prose-headings:text-gray-900 prose-strong:text-[#4C8233] prose-a:text-blue-600 prose-a:font-bold prose-a:no-underline hover:prose-a:underline">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    urlTransform={(value) => value}
                                    components={{
                                        a: ({ node, href, children, ...props }) => {
                                            if (href?.startsWith('action:navigate:')) {
                                                const parts = href.split(':'); // action:navigate:PAGE:ID
                                                const pageLabel = parts[2];
                                                const linkedResourceId = parts[3];

                                                return (
                                                    <button
                                                        onClick={async () => {
                                                            let targetRes = null;

                                                            // Find target resource logic (shared with timestamp)
                                                            if (linkedResourceId) {
                                                                targetRes = availableResources.find(r => r._id === linkedResourceId || r._id?.toString() === linkedResourceId);
                                                            }
                                                            if (!targetRes && fallbackResourceId) {
                                                                targetRes = availableResources.find(r => r._id === fallbackResourceId || r._id?.toString() === fallbackResourceId);
                                                            }
                                                            // 3. Last Resort: Find ANY PDF if we are not on one
                                                            if (!targetRes && currentResource?.type !== 'pdf') {
                                                                // Context-aware fallback: Check if any PDF title is mentioned in the message
                                                                targetRes = availableResources.find(r => r.type === 'pdf' && item.content?.includes(r.title));

                                                                // If no title match, just pick the first PDF (or last active?)
                                                                if (!targetRes) {
                                                                    targetRes = availableResources.find(r => r.type === 'pdf');
                                                                }
                                                            }

                                                            // Switch if needed
                                                            if (targetRes && targetRes._id !== currentResource?.id) {
                                                                console.log("Switching to PDF:", targetRes.title);
                                                                // FIX: switchResource expects ID string, not object!
                                                                switchResource(targetRes._id?.toString() || targetRes.id);
                                                                await new Promise(r => setTimeout(r, 1000));
                                                            }

                                                            jumpToLabel(pageLabel);
                                                        }}
                                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors mx-1 font-bold text-xs border border-blue-200 align-middle transform -translate-y-px"
                                                    >
                                                        <BookOpen size={10} />
                                                        {children}
                                                    </button>
                                                );
                                            }
                                            if (href?.startsWith('action:timestamp:')) {
                                                const raw = href.replace('action:timestamp:', '');
                                                let ts = raw;
                                                let linkedResourceId = undefined;

                                                // Check if last part is a MongoDB ID (24 hex chars)
                                                // Or if it matches our "fake ID" pattern if we can't fix Agent yet
                                                // But robust parsing: splity by last colon?
                                                const parts = raw.split(':');

                                                // Heuristic: valid timestamp has 1 or 2 colons.
                                                // valid ID has 0 colons.
                                                // If we have > 2 parts, maybe last one is ID?
                                                // If parts are ["0", "33", "ID"] -> 3 parts.
                                                // If parts are ["0", "33"] -> 2 parts.

                                                // Better approach: Regex match the timestamp at start.
                                                // ^(\d{1,2}:)?\d{1,2}:\d{2}
                                                const tsMatch = raw.match(/^(\d{1,2}:)?\d{1,2}:\d{2}/);
                                                if (tsMatch) {
                                                    ts = tsMatch[0];
                                                    const remainder = raw.substring(ts.length);
                                                    if (remainder.trim().startsWith(':')) {
                                                        const suffix = remainder.trim().substring(1);
                                                        // Fix for "0:33:69" where 69 is hallucinated index
                                                        if (suffix.length > 20) {
                                                            linkedResourceId = suffix;
                                                        } else {
                                                            console.log("Ignoring short suffix/hallucination:", suffix);
                                                        }
                                                    }
                                                } else {
                                                    // Fallback for simple seconds?
                                                    // If raw is "5:ID", last part might be ID
                                                    if (raw.includes(':')) {
                                                        const parts = raw.split(':');
                                                        const lastPart = parts[parts.length - 1];

                                                        if (lastPart.length > 20) { // ObjectId len is 24
                                                            linkedResourceId = lastPart;
                                                            ts = parts.slice(0, parts.length - 1).join(':');
                                                        } else {
                                                            ts = raw;
                                                        }
                                                    }
                                                }

                                                return (
                                                    <button
                                                        onClick={async () => {
                                                            const timeParts = ts.split(':').map(Number);
                                                            let seconds = 0;
                                                            if (timeParts.length === 3) seconds = timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
                                                            else if (timeParts.length === 2) seconds = timeParts[0] * 60 + timeParts[1];
                                                            else seconds = timeParts[0];

                                                            console.log("Timestamp Click:", { ts, timeParts, seconds, linkedResourceId, currentResourceId: currentResource?._id });

                                                            // Determine target resource
                                                            let targetRes = null;

                                                            // 1. Explicit resource from link (Best Match)
                                                            if (linkedResourceId) {
                                                                targetRes = availableResources.find(r => r._id === linkedResourceId || r._id?.toString() === linkedResourceId);
                                                            }

                                                            // 2. Explicit resource from generic "single" tool (Fallback)
                                                            if (!targetRes && fallbackResourceId) {
                                                                targetRes = availableResources.find(r => r._id === fallbackResourceId || r._id?.toString() === fallbackResourceId);
                                                            }

                                                            // 3. Last Resort: Find ANY video if we are not on one
                                                            if (!targetRes && currentResource?.type !== 'video' && currentResource?.type !== 'audio') {
                                                                targetRes = availableResources.find(r => r.type === 'video') || availableResources.find(r => r.type === 'audio');
                                                            }

                                                            console.log("Target Resource:", targetRes?.title, "Current:", currentResource?.title);

                                                            // Switch if needed
                                                            if (targetRes && targetRes._id !== currentResource?._id) {
                                                                console.log("Switching to resource:", targetRes.title);
                                                                switchResource(targetRes.id);
                                                                await new Promise(r => setTimeout(r, 1500));
                                                            } else if (!targetRes && currentResource?.type !== 'video' && currentResource?.type !== 'audio') {
                                                                alert("No video resource found to jump to.");
                                                                return;
                                                            }

                                                            seekTo(seconds);
                                                        }}
                                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors mx-1 font-bold text-xs border border-blue-200 align-middle transform -translate-y-px"
                                                    >
                                                        <Clock size={10} />
                                                        {children}
                                                    </button>
                                                );
                                            }
                                            return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
                                        },
                                        code: ({ node, className, children, ...props }) => {
                                            const match = /language-(\w+)/.exec(className || '');
                                            return match ? (
                                                <div className="rounded-lg bg-gray-900 border border-gray-800 shadow-sm my-4 overflow-hidden w-full">
                                                    <div className="bg-gray-800/50 px-4 py-2 flex items-center justify-between border-b border-gray-800">
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex gap-1.5">
                                                                <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
                                                                <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                                                                <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
                                                            </div>
                                                            <div className="text-xs text-gray-500 font-mono uppercase tracking-wider font-semibold">
                                                                {match[1]}
                                                            </div>
                                                        </div>
                                                        <Play size={12} className="text-gray-600" />
                                                    </div>
                                                    <div className="p-4 overflow-x-auto text-sm font-mono leading-relaxed text-gray-300">
                                                        <code className={className} {...props}>
                                                            {children}
                                                        </code>
                                                    </div>
                                                </div>
                                            ) : (
                                                <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800" {...props}>
                                                    {children}
                                                </code>
                                            );
                                        }
                                    }}
                                >
                                    {/* Linkify Timestamps (0:00, 00:00, or 1:30). Match with Map for resource ID */}
                                    {item.content
                                        ?.replace(/\b(\d{1,2}:)?\d{1,2}:\d{2}\b/g, (match) => {
                                            const embeddedId = timestampMap.get(match);
                                            return `[${match}](action:timestamp:${match}${embeddedId ? ':' + embeddedId : ''})`;
                                        })
                                        ?.replace(/\b(page|p\.|pg)\.?\s*(\d{1,5})\b/gi, (match, prefix, pageNum) => {
                                            const embeddedId = pageMap.get(pageNum);
                                            // Only linkify if we have a map entry OR if it looks like a valid page reference in context
                                            // But for now, let's linkify all "Page X" if we can, defaulting to current doc if no ID?
                                            // Actually, if no ID in map, our handler tries fallbackResourceId.
                                            return `[${match}](action:navigate:${pageNum}${embeddedId ? ':' + embeddedId : ''})`;
                                        })
                                    }
                                </ReactMarkdown>
                            </div>
                        </div>

                        {item.suggestedActions && item.suggestedActions.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2 ml-11">
                                {item.suggestedActions.map((action, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleAction(action.label, action.intent)}
                                        disabled={loading}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 ${action.priority === 'primary'
                                            ? 'bg-[#E3F2DF] text-[#4C8233] hover:bg-[#4C8233] hover:text-white border border-[#4C8233]/20'
                                            : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200'
                                            }`}
                                    >
                                        {action.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Append Tool Results that accompany text (e.g. Plan Adjustments) */}
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
                    // Also show milestone updates if they happen WITH text
                    if (result?.type === 'code_execution') {
                        return (
                            <div key={idx} className="mt-4 w-full rounded-lg overflow-hidden border border-gray-200 shadow-sm ml-11 max-w-[90%]">
                                <div className="bg-gray-900 px-4 py-2 flex items-center gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                                    </div>
                                    <div className="text-xs text-gray-400 font-mono ml-2 flex items-center gap-1">
                                        <span className="text-gray-500">python</span>
                                        <span>main.py</span>
                                    </div>
                                </div>
                                <div className="bg-[#1e1e1e] p-4 text-sm font-mono leading-relaxed">
                                    <div className="text-purple-300 mb-2 border-b border-gray-800 pb-2">
                                        <span className="text-gray-500 mr-2">1</span>
                                        {result.code}
                                    </div>
                                    <div className="text-green-400 mt-2">
                                        <span className="text-gray-500 select-none mr-2">{'>'}</span>
                                        {result.output || <span className="text-gray-600 italic">No output</span>}
                                    </div>
                                </div>
                            </div>
                        );
                    }
                    if (result?.type === 'milestone_update') {
                        return (
                            <div key={idx} className="flex items-center gap-2 text-xs text-gray-500 font-medium bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 shadow-sm w-fit ml-11">
                                <CheckCircle2 size={12} className="text-[#4C8233]" />
                                <span>{result.newStatus === 'completed' ? 'Completed' : 'Started'}: <strong className="text-gray-700">{result.milestoneLabel}</strong></span>
                            </div>
                        );
                    }
                    return null;
                })}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-white to-gray-50 relative">

            {/* Session Header + Tabs */}
            <div className="border-b border-gray-100 bg-white shrink-0">
                <div className="flex items-center justify-between p-6 pb-2">
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg">{topicName.replace(/\*\*/g, '')}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {progress.isComplete ? "Session complete!" : companionStatus}
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center px-6 gap-6 mt-2">
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'chat' ? 'text-[#4C8233] border-[#4C8233]' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
                    >
                        <MessageSquare size={16} />
                        Chat
                    </button>
                    <button
                        onClick={() => setActiveTab('plan')}
                        className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'plan' ? 'text-[#4C8233] border-[#4C8233]' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
                    >
                        <MapIcon size={16} />
                        Roadmap
                        {milestones.length > 0 && (
                            <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-[10px]">
                                {milestones.filter(m => m.status === 'completed').length}/{milestones.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Navigation Hint Banner */}
            {navigationHint && (
                <div className="mx-6 mb-2 mt-4 px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2 animate-in slide-in-from-top duration-300">
                    <BookOpen size={16} className="text-blue-600" />
                    <span className="text-sm text-blue-700 font-medium">{navigationHint}</span>
                </div>
            )}

            {/* Content Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto bg-gray-50/50">

                {/* CHAT TAB */}
                {activeTab === 'chat' && (
                    <div className="px-6 py-6 space-y-6">
                        {transcript.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-40 opacity-50 mt-10">
                                <Sparkles size={32} className="text-[#4C8233] mb-2" />
                                <p className="text-sm font-medium text-gray-400">Ready when you are...</p>
                            </div>
                        )}

                        {transcript.map(renderMessage)}

                        {loading && (
                            <div className="flex items-center gap-2 text-gray-500 ml-4">
                                <Loader2 size={16} className="animate-spin" />
                                <span className="text-xs font-medium">{companionStatus}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* PLAN TAB */}
                {activeTab === 'plan' && (
                    <div className="p-6 space-y-8 max-w-xl mx-auto">

                        {/* Milestones Section */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                <MapIcon size={14} />
                                Session Roadmap
                            </h4>

                            {milestones.length === 0 ? (
                                <div className="p-8 bg-white rounded-2xl border border-dashed border-gray-200 text-center text-gray-400 text-sm">
                                    No milestones yet. Chat to create a plan!
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {milestones.map((m, idx) => (
                                        <div key={idx} className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${m.status === 'active'
                                            ? 'bg-white border-[#4C8233] shadow-md shadow-[#4C8233]/5 ring-1 ring-[#4C8233]'
                                            : m.status === 'completed'
                                                ? 'bg-gray-50 border-gray-100 opacity-70'
                                                : 'bg-white border-gray-100'
                                            }`}>
                                            <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${m.status === 'completed' ? 'bg-[#4C8233] text-white' :
                                                m.status === 'active' ? 'bg-[#E3F2DF] text-[#4C8233]' : 'bg-gray-100 text-gray-400'
                                                }`}>
                                                {m.status === 'completed' ? <CheckCircle2 size={12} /> :
                                                    m.status === 'active' ? <div className="w-2 h-2 bg-current rounded-full animate-pulse" /> :
                                                        <div className="w-2 h-2 bg-current rounded-full" />}
                                            </div>
                                            <div>
                                                <p className={`text-sm font-medium ${m.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                                    {m.label}
                                                </p>
                                                {m.reasoning && (
                                                    <p className="text-xs text-gray-500 mt-1">{m.reasoning}</p>
                                                )}
                                                {m.status === 'active' && (
                                                    <span className="inline-block mt-2 text-[10px] font-bold bg-[#E3F2DF] text-[#4C8233] px-2 py-0.5 rounded-full">
                                                        Current Focus
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Parking Lot Section */}
                        <div className="space-y-4 pt-4 border-t border-gray-100">
                            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                <StickyNote size={14} />
                                Parking Lot
                            </h4>

                            {parkingLot.length === 0 ? (
                                <p className="text-sm text-gray-400 italic">No distracted thoughts parked yet.</p>
                            ) : (
                                <div className="grid grid-cols-1 gap-3">
                                    {parkingLot.map((item, idx) => (
                                        <div key={idx} className="bg-yellow-50 border border-yellow-100 p-4 rounded-xl relative group">
                                            <p className="text-xs font-bold text-yellow-800 uppercase mb-1">{item.topic}</p>
                                            <p className="text-sm text-yellow-900 font-medium">{item.question}</p>
                                            {item.context && <p className="text-xs text-yellow-700 mt-2 opacity-70">Context: {item.context}</p>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                )}
            </div>

            {/* Input Overlay */}
            <div className="p-6 bg-white border-t border-gray-100 shrink-0 z-10">
                <div className="relative flex items-center shadow-sm shadow-gray-100 rounded-2xl bg-gray-50 border border-gray-200 focus-within:ring-2 ring-[#4C8233]/10 ring-offset-2 transition-all">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(input)}
                        placeholder={activeTab === 'plan' ? "Ask about the plan or switch to chat..." : "Ask me anything or say 'Ready'..."}
                        className="flex-1 px-4 py-3 bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400 font-medium"
                        autoFocus
                    />
                    <button
                        onClick={() => handleSendMessage(input)}
                        disabled={!input.trim() || loading}
                        className="mr-2 p-2 bg-[#4C8233] hover:bg-[#2F4F2F] text-white rounded-xl transition-all disabled:opacity-50 disabled:bg-gray-300 shadow-md transform active:scale-95"
                    >
                        <ArrowRight size={18} />
                    </button>
                </div>
                {/* Status */}
                <div className="mt-2 text-center flex items-center justify-center gap-2">
                    <p className="text-[10px] text-gray-400 font-medium">{companionStatus}</p>
                </div>
            </div>
        </div>
    );
}
