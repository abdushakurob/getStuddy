import { getCourseContent } from '@/lib/actions-course';
import CourseExplorer from '@/components/courses/CourseExplorer';
import Link from 'next/link';
import { ArrowLeft, MoreHorizontal } from 'lucide-react';

// Next.js 15+ Params handling
type Props = {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function CoursePage({ params, searchParams }: Props) {
    const { id: courseId } = await params;
    const { folderId } = await searchParams;

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

                <button className="p-2 text-gray-300 hover:text-black hover:bg-gray-100 rounded-full transition-colors">
                    <MoreHorizontal size={24} />
                </button>
            </div>

            {/* Explorer */}
            <div className="flex-1 min-h-0"> {/* min-h-0 crucial for flex scroll */}
                <CourseExplorer
                    courseId={courseId}
                    initialData={data}
                    currentFolderId={currentFolderId}
                />
            </div>
        </div>
    );
}
