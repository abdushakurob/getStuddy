import { getCourseContent } from '@/lib/actions-course';
import CourseExplorer from '@/components/courses/CourseExplorer';
import Link from 'next/link';
import { ArrowLeft, MoreHorizontal } from 'lucide-react';
import NegotiationChat from '@/components/chat/NegotiationChat';

// Next.js 15+ Params handling
type Props = {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function CoursePage({ params, searchParams }: Props) {
    const { id: courseId } = await params;
    const { folderId, tab } = await searchParams; // Get tab from URL

    const currentTab = typeof tab === 'string' ? tab : 'library'; // Default to library
    const currentFolderId = typeof folderId === 'string' ? folderId : null;

    const data = await getCourseContent(courseId, currentFolderId);

    return (
        <div className="h-full flex flex-col p-6">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/courses" className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-[#1F2937]">{data.courseTitle}</h1>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Course Library</p>
                    </div>
                </div>

                {/* TABS */}
                <div className="flex bg-gray-100 p-1 rounded-full">
                    <Link
                        href={`/dashboard/courses/${courseId}?tab=library`}
                        className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${currentTab === 'library' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Library
                    </Link>
                    <Link
                        href={`/dashboard/courses/${courseId}?tab=plan`}
                        className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${currentTab === 'plan' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Plan
                    </Link>
                </div>

                <button className="p-2 text-gray-300 hover:text-black hover:bg-gray-100 rounded-full transition-colors">
                    <MoreHorizontal size={24} />
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-0">
                {currentTab === 'library' ? (
                    <CourseExplorer
                        courseId={courseId}
                        initialData={data}
                        currentFolderId={currentFolderId}
                    />
                ) : (
                    <NegotiationChat courseId={courseId} />
                )}
            </div>
        </div>
    );
}
