import { auth } from '@/auth';
import { Calendar, Flame, Zap, ArrowRight, Clock } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
    const session = await auth();
    const user = session?.user;

    return (
        <div className="h-full flex flex-col p-8 overflow-y-auto">

            {/* --- HEADER --- */}
            <div className="mb-10">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">☀️</span>
                    <h1 className="text-3xl font-black text-[#1F2937]">Good Morning, {user?.name?.split(' ')[0] || 'Scholar'}.</h1>
                </div>
                <p className="text-gray-500 font-medium">Ready to conquer your goals today?</p>
            </div>

            {/* --- HERO: DAILY MISSION --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">

                {/* Mission Card (2 cols) */}
                <div className="md:col-span-2 bg-[#1F2937] rounded-[32px] p-8 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#4C8233] opacity-20 blur-[80px] rounded-full group-hover:scale-110 transition-transform duration-700 pointer-events-none"></div>

                    <div className="relative z-10 h-full flex flex-col">
                        <div className="flex items-start justify-between mb-8">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-[#4C8233] mb-3 border border-white/5">
                                    <Zap size={14} fill="currentColor" />
                                    <span>DAILY MISSION</span>
                                </div>
                                <h2 className="text-3xl font-black mb-2 leading-tight">No Active Mission</h2>
                                <p className="text-gray-400 font-medium max-w-md">
                                    To get your daily plan, you need to set up your courses and syllabus first.
                                </p>
                            </div>
                        </div>

                        <div className="mt-auto">
                            <Link href="/dashboard/courses" className="inline-flex items-center gap-2 px-6 py-3 bg-[#4C8233] text-white rounded-2xl font-bold hover:bg-[#3D6A29] transition-colors">
                                <span>Setup Courses</span>
                                <ArrowRight size={18} />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Stats Column */}
                <div className="space-y-6">
                    {/* Streak Card */}
                    <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center h-48">
                        <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mb-3">
                            <Flame size={24} fill="currentColor" />
                        </div>
                        <div className="text-4xl font-black text-[#1F2937] mb-1">0</div>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">Day Streak</div>
                    </div>

                    {/* XP Card */}
                    <div className="bg-indigo-600 p-6 rounded-[32px] shadow-lg shadow-indigo-200 flex flex-col items-center justify-center text-center h-48 text-white relative overflow-hidden">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-3 backdrop-blur-sm">
                            <Zap size={24} fill="currentColor" />
                        </div>
                        <div className="text-4xl font-black mb-1">0</div>
                        <div className="text-xs font-bold text-white/60 uppercase tracking-wide">Total XP</div>
                    </div>
                </div>
            </div>

            {/* --- RECENT ACTIVITY --- */}
            <div>
                <h3 className="text-xl font-bold text-[#1F2937] mb-6 flex items-center gap-2">
                    <Clock size={20} className="text-gray-400" />
                    <span>Recent Activity</span>
                </h3>

                <div className="bg-white rounded-[32px] border border-gray-100 p-8 text-center text-gray-400 font-medium">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-300">
                        <Calendar size={24} />
                    </div>
                    No activity yet. Your journey begins today.
                </div>
            </div>

        </div>
    );
}
