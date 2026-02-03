import { getCourseContent } from '@/lib/actions-course';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import StrategyBoard from '@/components/courses/StrategyBoard';

// Next.js 15+ Params
type Props = {
    params: Promise<{ id: string }>;
};

export default async function StrategyPage({ params }: Props) {
    const { id: courseId } = await params;

    // Fetch Active Plan
    const data = await getCourseContent(courseId, null);

    return (
        <div className="h-full flex flex-col bg-[#F9FAFB] overflow-hidden">

            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center gap-4 shrink-0">
                <Link href={`/dashboard/courses/${courseId}`} className="p-2 hover:bg-gray-50 rounded-full text-gray-400 hover:text-gray-900 transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-lg font-bold text-gray-900">Strategy Map</h1>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative">
                {data.activePlan ? (
                    <StrategyBoard plan={data.activePlan} courseId={courseId} />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Plus size={32} className="text-gray-400" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">No Strategy Defined</h2>
                        <p className="text-gray-500 max-w-md mb-6">Create a study plan to visualize your roadmap here.</p>
                        <Link
                            href={`/dashboard/courses/${courseId}/negotiate`}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2"
                        >
                            Create Plan
                        </Link>
                    </div>
                )}
            </div>

        </div>
    );
}
