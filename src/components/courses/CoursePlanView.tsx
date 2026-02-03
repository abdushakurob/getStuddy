'use client';

import { useState } from 'react';
import { Calendar, CheckCircle, Circle, Play, Target, ArrowRight } from 'lucide-react';
import NegotiationChat from '@/components/chat/NegotiationChat';
import { continueMission } from '@/lib/actions-dashboard';

interface CoursePlanViewProps {
    courseId: string;
    plan: any; // Using simplified type for now
}

export default function CoursePlanView({ courseId, plan }: CoursePlanViewProps) {
    const [isStarting, setIsStarting] = useState(false);

    // Filter tasks
    const tasks = plan.schedule || [];
    const pendingTasks = tasks.filter((t: any) => t.status === 'pending');
    const completedTasks = tasks.filter((t: any) => t.status === 'completed');

    return (
        <div className="flex h-full gap-6">

            {/* LEFT: PLAN SCHEDULE (35%) */}
            <div className="w-1/3 flex flex-col gap-6 overflow-hidden">

                {/* Plan Header Card */}
                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm shrink-0 relative overflow-hidden group">
                    {/* Abstract bg shape */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full blur-3xl opacity-50 -mr-10 -mt-10" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center shadow-lg shadow-gray-200">
                                <Target size={20} />
                            </div>
                            <div>
                                <h2 className="font-bold text-gray-800 leading-tight">{plan.phase}</h2>
                                <p className="text-xs text-gray-400 uppercase font-bold tracking-wide">Current Phase</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed font-medium mb-6">
                            {plan.goal}
                        </p>

                        {/* Primary Action - Explicit "Launch Workspace" */}
                        <form action={continueMission}>
                            <button
                                className="w-full py-4 bg-[#4C8233] hover:bg-[#3d6929] text-white rounded-xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 shadow-md shadow-green-900/10 group-hover:scale-[1.02]"
                            >
                                <Play size={18} fill="currentColor" />
                                <span>Launch Workspace</span>
                                <ArrowRight size={18} className="opacity-60" />
                            </button>
                        </form>
                    </div>
                </div>

                {/* Task List (Simplified) */}
                <div className="flex-1 overflow-y-auto bg-white rounded-[32px] border border-gray-100 p-6 space-y-4">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest sticky top-0 bg-white pb-2 z-10 flex items-center justify-between">
                        <span>Syllabus</span>
                        <span className="text-xs text-gray-300 font-normal">{pendingTasks.length} Topics</span>
                    </h3>

                    {pendingTasks.map((task: any, idx: number) => (
                        <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-white border border-gray-100 group hover:border-gray-300 hover:shadow-sm transition-all items-center">
                            <div className="text-gray-300 group-hover:text-[#4C8233] transition-colors">
                                <Circle size={14} strokeWidth={3} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-800 text-sm">{task.topicName}</h4>
                                {/* Removed Date/Type chips as requested */}
                            </div>
                        </div>
                    ))}

                    {completedTasks.length > 0 && (
                        <>
                            <div className="border-t border-gray-100 my-4" />
                            {completedTasks.map((task: any, idx: number) => (
                                <div key={idx} className="flex gap-4 p-3 opacity-50 grayscale">
                                    <div className="text-green-500"><CheckCircle size={16} /></div>
                                    <span className="text-sm font-medium line-through text-gray-500">{task.topicName}</span>
                                </div>
                            ))}
                        </>
                    )}
                </div>

            </div>

            {/* RIGHT: CHAT (65%) */}
            <div className="flex-1 flex flex-col bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden relative">
                <NegotiationChat courseId={courseId} />
            </div>

        </div>
    );
}
