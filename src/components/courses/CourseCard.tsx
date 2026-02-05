'use client';

import Link from 'next/link';
import { Folder, MoreVertical } from 'lucide-react';
import { CourseData } from '@/lib/actions-course';

export default function CourseCard({ course }: { course: CourseData }) {
    return (
        <Link
            href={`/dashboard/courses/${course.id}`}
            className="group bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/50 hover:border-gray-200 transition-all duration-300 relative overflow-hidden block"
        >
            {/* Color Tag */}
            <div className="absolute top-0 left-0 w-2 h-full transition-all group-hover:w-3" style={{ backgroundColor: course.color }} />

            <div className="flex justify-between items-start mb-4 pl-4">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-black transition-colors">
                    <Folder size={24} />
                </div>
                <button className="p-2 text-gray-300 hover:text-black transition-colors z-10 relative" onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Dropdown menu logic here
                    console.log("Menu clicked");
                }}>
                    <MoreVertical size={20} />
                </button>
            </div>

            <div className="pl-4">
                <h3 className="text-xl font-bold text-[#1F2937] mb-2 line-clamp-1 group-hover:text-black">{course.title}</h3>
                <p className="text-sm font-medium text-gray-400 line-clamp-2 h-10 mb-6">
                    {course.description || "No description provided."}
                </p>

                {/* <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-gray-300" />
                         <span>0 Files</span> 
                    </div>
                </div> */}
            </div>
        </Link>
    );
}
