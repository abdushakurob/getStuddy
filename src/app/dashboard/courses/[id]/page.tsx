import { getCourseContent } from '@/lib/actions-course';
import CourseExplorer from '@/components/courses/CourseExplorer';
import Link from 'next/link';
import { ArrowLeft, Plus, ArrowRight } from 'lucide-react';
import { continueMission } from '@/lib/actions-dashboard';
import { QuickStudyCTA } from '@/components/quick-study/QuickStudyButton';

type Props = {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function CoursePage({ params, searchParams }: Props) {
    const { id: courseId } = await params;
    const { folderId, tab } = await searchParams;
    const currentFolderId = typeof folderId === 'string' ? folderId : null;
    const activeTab = typeof tab === 'string' ? tab : 'resources';

    // Fetch Content + Active Plan
    const data = await getCourseContent(courseId, currentFolderId);

    return (
        <div className="h-full flex flex-col p-8 overflow-hidden">

            {/* HEADER */}
            <div className="flex items-center justify-between mb-6 shrink-0">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/courses" className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{data.courseTitle}</h1>
                        <p className="text-sm text-gray-500">Manage your learning materials and study plan</p>
                    </div>
                </div>

                {/* Action: Create/Continue */}
                {data.activePlan ? (
                    <form action={continueMission}>
                        <button className="px-6 py-3 bg-[#4C8233] hover:bg-[#2F4F2F] text-white rounded-xl font-bold transition-all flex items-center gap-2">
                            <span>Continue Mission</span>
                            <ArrowRight size={18} />
                        </button>
                    </form>
                ) : (
                    <Link
                        href={`/dashboard/courses/${courseId}/negotiate`}
                        className="px-6 py-3 bg-[#4C8233] hover:bg-[#2F4F2F] text-white rounded-xl font-bold transition-all flex items-center gap-2"
                    >
                        <Plus size={18} />
                        <span>Create Study Plan</span>
                    </Link>
                )}
            </div>

            {/* Quick Study CTA */}
            <div className="mb-6 shrink-0">
                <QuickStudyCTA 
                    title="Need help with this course?"
                    description="Start a focused study session on any topic"
                    courseId={courseId}
                />
            </div>

            {/* TABS - Pill Style Toggle */}
            <div className="flex justify-center mb-6 shrink-0">
                <div className="inline-flex bg-gray-100 rounded-full p-1">
                    <Link
                        href={`/dashboard/courses/${courseId}?tab=resources`}
                        className={`px-6 py-2 rounded-full font-medium text-sm transition-all ${activeTab === 'resources'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Library
                    </Link>
                    <Link
                        href={`/dashboard/courses/${courseId}?tab=plan`}
                        className={`px-6 py-2 rounded-full font-medium text-sm transition-all ${activeTab === 'plan'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Plan
                    </Link>
                </div>
            </div>

            {/* TAB CONTENT */}
            <div className="flex-1 min-h-0">
                {activeTab === 'resources' && (
                    <div className="h-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <CourseExplorer
                            courseId={courseId}
                            initialData={data}
                            currentFolderId={currentFolderId}
                        />
                    </div>
                )}

                {activeTab === 'plan' && (
                    <div className="h-full bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-auto">
                        {data.activePlan ? (
                            <div>
                                <div className="mb-6">
                                    <div className="inline-block px-3 py-1 bg-[#A3B18A]/10 text-[#4C8233] rounded-full text-xs font-bold mb-3">
                                        {data.activePlan.phase}
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-2">{data.activePlan.goal}</h2>
                                </div>

                                {/* Schedule */}
                                {data.activePlan.schedule && data.activePlan.schedule.length > 0 && (
                                    <div className="space-y-3">
                                        <h3 className="font-bold text-gray-700 text-sm mb-3">Study Schedule</h3>
                                        {data.activePlan.schedule.map((task: any, idx: number) => (
                                            <div
                                                key={idx}
                                                className={`p-4 rounded-xl border ${task.status === 'completed'
                                                    ? 'bg-green-50 border-green-200'
                                                    : task.status === 'in-progress'
                                                        ? 'bg-amber-50 border-amber-200'
                                                        : 'bg-gray-50 border-gray-200'
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h4 className="font-bold text-gray-900">{task.topicName}</h4>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {new Date(task.date).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric'
                                                            })}
                                                        </p>
                                                    </div>
                                                    <span className={`text-xs font-bold px-2 py-1 rounded ${task.status === 'completed'
                                                        ? 'bg-green-100 text-green-700'
                                                        : task.status === 'in-progress'
                                                            ? 'bg-amber-100 text-amber-700'
                                                            : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {task.status || 'pending'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Adjust Plan */}
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <Link
                                        href={`/dashboard/courses/${courseId}/negotiate`}
                                        className="text-sm text-[#4C8233] hover:text-[#2F4F2F] font-medium"
                                    >
                                        Adjust Study Plan →
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <h3 className="text-lg font-bold text-gray-800 mb-2">No Study Plan Yet</h3>
                                <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
                                    Create a study plan to get personalized guidance and track your progress.
                                </p>
                                <Link
                                    href={`/dashboard/courses/${courseId}/negotiate`}
                                    className="inline-flex px-6 py-3 bg-[#4C8233] hover:bg-[#2F4F2F] text-white rounded-xl font-bold transition-all items-center gap-2"
                                >
                                    <Plus size={18} />
                                    <span>Create Study Plan</span>
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>

        </div>
    );
}
