import NegotiationChat from '@/components/chat/NegotiationChat';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getActivePlan } from '@/lib/actions-chat';

type Props = {
    params: Promise<{ id: string }>;
};

export default async function NegotiationPage({ params }: Props) {
    const { id: courseId } = await params;

    // Check for existing plan
    const existingPlan = await getActivePlan(courseId);

    return (
        <div className="h-full flex flex-col bg-white overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4 shrink-0">
                <Link href={`/dashboard/courses/${courseId}`} className="p-2 hover:bg-gray-50 rounded-full text-gray-400 hover:text-gray-900 transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-lg font-bold text-gray-900">Plan with Studdy</h1>
                    <p className="text-xs text-gray-400">Design your study plan together.</p>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                <NegotiationChat courseId={courseId} existingPlan={existingPlan} />
            </div>
        </div>
    );
}
