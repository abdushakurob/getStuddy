'use client';

import { useState } from 'react';
import { Calendar, CheckCircle, Circle, ArrowRight, Target, Clock, Filter, Plus } from 'lucide-react';
import { continueMission } from '@/lib/actions-dashboard';

interface StrategyBoardProps {
    plan: any; // Simplified type for now
    courseId: string;
}

export default function StrategyBoard({ plan, courseId }: StrategyBoardProps) {
    // Basic grouping by status for now (Kanban-ish but vertical list)
    const tasks = plan.schedule || [];
    const pendingTasks = tasks.filter((t: any) => t.status === 'pending');
    const completedTasks = tasks.filter((t: any) => t.status === 'completed');

    return (
        <div className="h-full flex flex-col bg-[#F9FAFB]">

            {/* Header / Strategy Meta */}
            <div className="bg-white border-b border-gray-200 px-8 py-6 flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wide border border-indigo-100">
                            Current Phase
                        </span>
                        <h2 className="text-xl font-bold text-gray-900">{plan.phase}</h2>
                    </div>
                    <p className="text-gray-500 max-w-2xl text-sm leading-relaxed">{plan.goal}</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-bold shadow-sm hover:bg-gray-50 flex items-center gap-2">
                        <Filter size={16} />
                        Filter
                    </button>
                    <button className="px-4 py-2 bg-black text-white rounded-lg text-sm font-bold hover:bg-gray-800 flex items-center gap-2 shadow-lg shadow-gray-200">
                        <Plus size={16} />
                        Add Task
                    </button>
                </div>
            </div>

            {/* Board Content */}
            <div className="flex-1 overflow-x-auto p-8">
                <div className="flex gap-8 h-full min-w-max">

                    {/* COLUMN 1: UPCOMING (To Do) */}
                    <div className="w-[350px] flex flex-col h-full">
                        <div className="flex items-center justify-between mb-4 px-1">
                            <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                <Circle size={16} className="text-gray-400" />
                                To Do
                            </h3>
                            <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-xs font-bold">{pendingTasks.length}</span>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 pb-4">
                            {pendingTasks.map((task: any, idx: number) => (
                                <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all group relative">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{new Date(task.date).toLocaleDateString()}</span>
                                        <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-black transition-opacity">
                                            <ArrowRight size={16} />
                                        </button>
                                    </div>
                                    <h4 className="font-bold text-gray-800 mb-1 leading-snug">{task.topicName}</h4>
                                    <p className="text-xs text-gray-500 line-clamp-2 mb-3">{task.reasoning}</p>

                                    {/* Action inside card */}
                                    <form action={continueMission}>
                                        <button className="w-full py-2 bg-gray-50 hover:bg-green-50 text-gray-600 hover:text-green-700 border border-gray-100 hover:border-green-200 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2">
                                            Execute
                                        </button>
                                    </form>
                                </div>
                            ))}
                            {pendingTasks.length === 0 && (
                                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400 text-sm">
                                    All clear! No pending tasks.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* COLUMN 2: IN PROGRESS (Mock) */}
                    <div className="w-[350px] flex flex-col h-full bg-gray-50/50 rounded-2xl border border-dashed border-gray-200/50 p-2 opacity-60">
                        <div className="flex items-center justify-between mb-4 px-1">
                            <h3 className="font-bold text-gray-400 flex items-center gap-2">
                                <Clock size={16} />
                                In Progress
                            </h3>
                            <span className="bg-gray-100 text-gray-400 px-2 py-0.5 rounded text-xs font-bold">0</span>
                        </div>
                        <div className="text-center text-xs text-gray-400 mt-10">Drag tasks here to start (Coming Soon)</div>
                    </div>

                    {/* COLUMN 3: COMPLETED */}
                    <div className="w-[350px] flex flex-col h-full">
                        <div className="flex items-center justify-between mb-4 px-1">
                            <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                <CheckCircle size={16} className="text-green-500" />
                                Done
                            </h3>
                            <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded text-xs font-bold border border-green-100">{completedTasks.length}</span>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 pb-4">
                            {completedTasks.map((task: any, idx: number) => (
                                <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-100 opacity-75">
                                    <h4 className="font-medium text-gray-500 line-through text-sm mb-1">{task.topicName}</h4>
                                    <div className="flex items-center gap-1 text-xs text-green-600 font-bold mt-2">
                                        <CheckCircle size={12} />
                                        <span>Completed</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
