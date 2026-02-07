import { auth } from '@/auth';
import { Calendar, Play, FolderOpen, ArrowRight, Clock, Plus, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { getDashboardData } from '@/lib/actions-dashboard';
import Greeting from '@/components/dashboard/Greeting';

export default async function DashboardPage() {
    const session = await auth();
    const user = session?.user;
    const data = await getDashboardData();

    // Helper to format date
    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    };

    return (
        <div className="h-full flex flex-col p-8 overflow-y-auto">

            {/* --- HEADER --- */}
            <div className="mb-10">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">☀️</span>
                    <Greeting userName={user?.name?.split(' ')[0] || 'Friend'} />
                </div>
                <p className="text-gray-500 font-medium">
                    Ready to learn something new today?
                </p>
            </div>

            {/* --- JUMP BACK IN --- */}
            {data?.lastSession && (
                <div className="mb-12">
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Jump Back In</h2>
                    <Link href={`/work/${data.lastSession.id}`} className="block group">
                        <div className="bg-[#1F2937] rounded-[32px] p-8 text-white relative overflow-hidden transition-transform hover:scale-[1.01] duration-300">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>

                            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                <div>
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 border border-white/5 text-gray-300">
                                            Last Active
                                        </span>
                                        <span className="text-sm text-gray-400 flex items-center gap-1">
                                            <Clock size={14} />
                                            {formatDate(data.lastSession.date)}
                                        </span>
                                    </div>
                                    <h3 className="text-3xl font-black mb-2 leading-tight group-hover:text-[#4C8233] transition-colors">
                                        {data.lastSession.topicName}
                                    </h3>
                                    <p className="text-gray-400 font-medium flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.lastSession.courseColor }}></span>
                                        {data.lastSession.courseTitle}
                                    </p>
                                </div>

                                <div className="w-16 h-16 rounded-full bg-[#4C8233] flex items-center justify-center shrink-0 group-hover:bg-[#3D6A29] transition-colors shadow-lg shadow-[#4C8233]/20">
                                    <Play size={24} fill="currentColor" className="ml-1" />
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>
            )}

            {/* --- MY COURSES --- */}
            <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-[#1F2937] flex items-center gap-2">
                        <FolderOpen size={20} className="text-gray-400" />
                        <span>My Library</span>
                    </h2>
                    <Link href="/dashboard/courses/new" className="text-sm font-bold text-[#4C8233] hover:underline flex items-center gap-1">
                        <Plus size={16} /> New Course
                    </Link>
                </div>

                {data?.activeCourses && data.activeCourses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {data.activeCourses.map((course: any) => (
                            <Link key={course.planId} href={`/dashboard/courses/${course.courseId}`} className="group block">
                                <div className="bg-white border border-gray-100 rounded-[24px] p-6 hover:shadow-md transition-all h-full flex flex-col">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm" style={{ backgroundColor: course.color }}>
                                            <BookOpen size={20} />
                                        </div>
                                        {/* Progress Pill */}
                                        <div className="px-2 py-1 bg-gray-50 rounded-lg text-xs font-bold text-gray-500">
                                            {course.progress}%
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-bold text-gray-800 mb-1 line-clamp-2 leading-tight group-hover:text-black">
                                        {course.title}
                                    </h3>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mt-auto pt-4">
                                        {course.phase} Phase
                                    </p>
                                </div>
                            </Link>
                        ))}

                        {/* Add New Card */}
                        <Link href="/dashboard/courses/new" className="group block h-full">
                            <div className="border-2 border-dashed border-gray-200 rounded-[24px] p-6 flex flex-col items-center justify-center h-full text-gray-400 hover:border-[#4C8233] hover:text-[#4C8233] hover:bg-[#4C8233]/5 transition-all min-h-[180px]">
                                <Plus size={32} className="mb-2" />
                                <span className="font-bold">Add Material</span>
                            </div>
                        </Link>
                    </div>
                ) : (
                    <div className="bg-white rounded-[32px] border border-gray-100 p-12 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-300">
                            <FolderOpen size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Library Empty</h3>
                        <p className="text-gray-500 mb-6 max-w-sm mx-auto">Upload a syllabus, YouTube playlist, or textbook to start learning.</p>
                        <Link href="/dashboard/courses/new" className="inline-flex items-center gap-2 px-6 py-3 bg-[#4C8233] text-white rounded-2xl font-bold hover:bg-[#3D6A29] transition-colors">
                            <Plus size={18} />
                            <span>Create First Course</span>
                        </Link>
                    </div>
                )}
            </div>

        </div>
    );
}
