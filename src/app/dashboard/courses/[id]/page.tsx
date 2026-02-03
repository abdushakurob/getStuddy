import { getCourseContent } from '@/lib/actions-course';
import CourseExplorer from '@/components/courses/CourseExplorer';
import Link from 'next/link';
import { ArrowLeft, MoreHorizontal, Target, Calendar, BarChart2, Plus, ArrowRight } from 'lucide-react';
import { continueMission } from '@/lib/actions-dashboard';

// Next.js 15+ Params handling
type Props = {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function CoursePage({ params, searchParams }: Props) {
    const { id: courseId } = await params;
    const { folderId } = await searchParams; // No more 'tab'
    const currentFolderId = typeof folderId === 'string' ? folderId : null;

    // Fetch Content + Active Plan
    const data = await getCourseContent(courseId, currentFolderId);

    return (
        <div className="h-full flex flex-col p-8 overflow-y-auto">

            {/* HEADER: Title + Actions */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/courses" className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-[#1F2937]">{data.courseTitle}</h1>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Course Command Center</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Link
                        href={`/dashboard/courses/${courseId}/plan`}
                        className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 flex items-center gap-2 transition-colors"
                    >
                        <Calendar size={16} />
                        <span>Strategy Map</span>
                    </Link>
                    <button className="p-2 text-gray-300 hover:text-black hover:bg-gray-100 rounded-full transition-colors">
                        <MoreHorizontal size={24} />
                    </button>
                </div>
            </div>

            {/* DASHBOARD GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">

                {/* 1. ACTIVE FOCUS (Span 2) */}
                <div className="lg:col-span-2 bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden group">
                    {/* Abstract Decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-700" />

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm bg-indigo-50 px-3 py-1 rounded-full">
                                <Target size={16} />
                                <span>Current Objective</span>
                            </div>
                            {data.activePlan && (
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{data.activePlan.phase}</span>
                            )}
                        </div>

                        {data.activePlan ? (
                            <>
                                <h2 className="text-2xl font-bold text-gray-800 mb-2 leading-tight">
                                    {data.activePlan.goal}
                                </h2>
                                <div className="mt-6 flex gap-3">
                                    <form action={continueMission}>
                                        <button className="px-6 py-3 bg-[#1F2937] text-white rounded-xl font-bold hover:bg-black transition-all flex items-center gap-2 shadow-lg shadow-gray-200">
                                            <span>Continue Mission</span>
                                            <ArrowRight size={18} />
                                        </button>
                                    </form>
                                    <div className="px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-500 flex items-center gap-2">
                                        <BarChart2 size={16} />
                                        <span>35% Complete</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <h2 className="text-xl font-bold text-gray-800 mb-2">No Active Strategy</h2>
                                <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">Create a study plan to unlock guided missions and tracking.</p>
                                <Link
                                    href={`/dashboard/courses/${courseId}/negotiate`}
                                    className="inline-flex px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all items-center gap-2"
                                >
                                    <Plus size={18} />
                                    <span>Create Plan</span>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. STATS / QUICK ACTIONS (Span 1) */}
                <div className="space-y-4">
                    <div className="bg-orange-50 p-6 rounded-[32px] border border-orange-100 h-full flex flex-col justify-between">
                        <div>
                            <h3 className="font-bold text-orange-900 mb-1">Time Invested</h3>
                            <p className="text-3xl font-black text-orange-600">12h 30m</p>
                        </div>
                        <div className="mt-4">
                            <div className="h-2 bg-orange-100 rounded-full overflow-hidden">
                                <div className="h-full bg-orange-500 w-[65%]" />
                            </div>
                            <p className="text-xs text-orange-400 font-bold mt-2 uppercase tracking-wide">Weekly Goal: 20h</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. LIBRARY SECTION */}
            <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Knowledge Base</h3>
                    {/* Maybe filters here */}
                </div>

                <div className="flex-1 bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden p-1">
                    <CourseExplorer
                        courseId={courseId}
                        initialData={data}
                        currentFolderId={currentFolderId}
                    />
                </div>
            </div>

        </div>
    );
}
