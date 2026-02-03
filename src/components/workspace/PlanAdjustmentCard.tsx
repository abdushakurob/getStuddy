'use client';

import { AlertTriangle, Calendar, TrendingUp, SkipForward, Clock } from 'lucide-react';
import { applyPlanAdjustment } from '@/lib/actions-plan';
import { useState } from 'react';

interface PlanAdjustmentCardProps {
    sessionId: string;
    adjustment: {
        type: 'plan_adjustment';
        reason: string;
        adjustmentType: 'add_review' | 'skip_ahead' | 'extend_topic' | 'reschedule';
        details: string;
        urgency: 'low' | 'medium' | 'high';
    };
    onApplied?: () => void;
}

export default function PlanAdjustmentCard({ sessionId, adjustment, onApplied }: PlanAdjustmentCardProps) {
    const [loading, setLoading] = useState(false);
    const [applied, setApplied] = useState(false);

    const handleApply = async () => {
        setLoading(true);
        try {
            await applyPlanAdjustment(sessionId, adjustment.adjustmentType, adjustment.details);
            setApplied(true);
            onApplied?.();
        } catch (error) {
            console.error('Failed to apply adjustment:', error);
        } finally {
            setLoading(false);
        }
    };

    const getIcon = () => {
        switch (adjustment.adjustmentType) {
            case 'add_review': return <Calendar size={20} />;
            case 'skip_ahead': return <SkipForward size={20} />;
            case 'extend_topic': return <Clock size={20} />;
            case 'reschedule': return <TrendingUp size={20} />;
        }
    };

    const getTitle = () => {
        switch (adjustment.adjustmentType) {
            case 'add_review': return 'Add Review Session';
            case 'skip_ahead': return 'Skip Ahead';
            case 'extend_topic': return 'Extend Topic';
            case 'reschedule': return 'Reschedule Plan';
        }
    };

    const urgencyColors = {
        low: 'bg-blue-50 border-blue-200 text-blue-700',
        medium: 'bg-amber-50 border-amber-200 text-amber-700',
        high: 'bg-red-50 border-red-200 text-red-700'
    };

    if (applied) {
        return (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <TrendingUp size={20} className="text-green-600" />
                    </div>
                    <div>
                        <h4 className="font-bold text-green-900">Plan Updated!</h4>
                        <p className="text-sm text-green-700">Your study plan has been adjusted.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`rounded-2xl p-5 border-2 ${urgencyColors[adjustment.urgency]}`}>
            <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center shrink-0">
                    {getIcon()}
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold">{getTitle()}</h4>
                        {adjustment.urgency === 'high' && (
                            <AlertTriangle size={16} className="text-red-600" />
                        )}
                    </div>
                    <p className="text-sm opacity-90 mb-2">{adjustment.reason}</p>
                    <p className="text-xs font-medium opacity-75">{adjustment.details}</p>
                </div>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={handleApply}
                    disabled={loading}
                    className="flex-1 py-2.5 bg-[#4C8233] hover:bg-[#2F4F2F] text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
                >
                    {loading ? 'Applying...' : 'Apply Adjustment'}
                </button>
                <button
                    disabled={loading}
                    className="px-4 py-2.5 bg-white/50 hover:bg-white border border-current rounded-xl font-medium text-sm transition-colors disabled:opacity-50"
                >
                    Dismiss
                </button>
            </div>
        </div>
    );
}
