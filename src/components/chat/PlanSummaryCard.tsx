'use client';

import { Calendar, Play, Edit3, CheckCircle } from 'lucide-react';

interface PlanSummaryCardProps {
    plan: {
        phase: string;
        goal: string;
        nextTask: {
            topic: string;
            date: string;
        };
        startUrl: string;
    };
}

export default function PlanSummaryCard({ plan }: PlanSummaryCardProps) {
    return (
        <div className="w-full max-w-md bg-white rounded-2xl border border-green-200 shadow-lg overflow-hidden my-4 mx-auto">
            {/* Header */}
            <div className="bg-green-50 p-4 border-b border-green-100 flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white shadow-sm">
                    <CheckCircle size={16} />
                </div>
                <div>
                    <h3 className="font-bold text-green-900 leading-tight">Plan Locked: {plan.phase}</h3>
                    <p className="text-xs text-green-700">Ready for execution</p>
                </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
                <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Goal</p>
                    <p className="text-sm text-gray-700">{plan.goal}</p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex items-start gap-3">
                    <Calendar size={18} className="text-gray-400 mt-0.5" />
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">First Mission</p>
                        <p className="font-bold text-gray-800">{plan.nextTask.topic}</p>
                        <p className="text-xs text-gray-500">{plan.nextTask.date}</p>
                    </div>
                </div>
            </div>

            {/* Footer / Actions */}
            <div className="bg-gray-50 p-4 flex gap-3 border-t border-gray-100">
                <a
                    href={plan.startUrl}
                    className="flex-1 bg-[#4C8233] hover:bg-[#3d6929] text-white text-sm font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md shadow-green-900/10"
                // Changed from "Start Mission" as requested
                >
                    <Play size={16} fill="currentColor" />
                    Go to Mission
                </a>
                <button
                    className="px-4 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
                    onClick={() => {
                        document.querySelector('input')?.focus();
                    }}
                >
                    <Edit3 size={16} />
                    Adjust
                </button>
            </div>
        </div>
    );
}
