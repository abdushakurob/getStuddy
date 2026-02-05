import { auth } from '@/auth';
import { Calendar, Flame, Zap, ArrowRight, Clock, Target, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { getDashboardData, continueMission } from '@/lib/actions-dashboard';

export default async function DashboardPage() {
    const session = await auth();
    const user = session?.user;
    const data = await getDashboardData();

    // Helper to format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    };

    return (
        <div className="h-full flex flex-col p-8 overflow-y-auto">

            {/* --- HEADER --- */}
            <div className="mb-10">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">☀️</span>
                    <h1 className="text-3xl font-black text-[#1F2937]">Good Morning, {user?.name?.split(' ')[0] || 'Scholar'}.</h1>
                </div>
                <p className="text-gray-500 font-medium">
                    {data?.hasPlan ? "I've got your next topic ready." : "Ready to get started?"}
                </p>
            </div>

            {/* --- HERO: DAILY MISSION --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">

                {/* Mission Card (Dynamic) */}
                <div className="md:col-span-2 bg-[#1F2937] rounded-[32px] p-8 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#4C8233] opacity-20 blur-[80px] rounded-full group-hover:scale-110 transition-transform duration-700 pointer-events-none"></div>

                    <div className="relative z-10 h-full flex flex-col">
                        <div className="flex items-start justify-between mb-8">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-[#4C8233] mb-3 border border-white/5">
                                    <Zap size={14} fill="currentColor" />
                                    <span>{data?.hasPlan ? "UP NEXT" : "NO PLAN YET"}</span>
                                </div>

                                {data?.hasPlan && data.mission ? (
                                    <>
                                        <h2 className="text-3xl font-black mb-2 leading-tight">{data.mission.topicName}</h2>
                                        <p className="text-gray-400 font-medium max-w-md">
                                            {data.mission.reasoning || "Focus on this topic to advance your goal."}
                                        </p>
                                        <div className="mt-4 flex items-center gap-3 text-sm text-gray-300">
                                            <span>{data.mission.isToday ? "Scheduled for Today" : `Coming up on ${formatDate(data.mission.dateString)}`}</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <h2 className="text-3xl font-black mb-2 leading-tight">Setup Your Strategy</h2>
                                        <p className="text-gray-400 font-medium max-w-md">
                                            To get your daily plan, upload a syllabus and chat with the Agent.
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="mt-auto">
                            {data?.hasPlan ? (
                                <form action={continueMission}>
                                    <button
                                        type="submit"
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#4C8233] text-white rounded-2xl font-bold hover:bg-[#3D6A29] transition-colors w-full md:w-auto justify-center"
                                    >
                                        <span>Go to Mission</span>
                                        <ArrowRight size={18} />
                                    </button>
                                </form>
                            ) : (
                                <Link href="/dashboard/courses" className="inline-flex items-center gap-2 px-6 py-3 bg-[#4C8233] text-white rounded-2xl font-bold hover:bg-[#3D6A29] transition-colors">
                                    <span>Go to Courses</span>
                                    <ArrowRight size={18} />
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats Column */}
                <div className="space-y-6">
                    {/* Progress Card (Replaces Streak for now if 0) */}
                    <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center h-48 relative overflow-hidden">
                        {/* Simple Circular Progress Placeholder */}
                        <div className="relative w-24 h-24 mb-2 flex items-center justify-center">
                            <svg className="w-full h-full" viewBox="0 0 36 36">
                                <path
                                    className="text-gray-100"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                <path
                                    className="text-[#4C8233]"
                                    strokeDasharray={`${data?.stats?.progress || 0}, 100`}
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                            </svg>
                            <span className="absolute text-xl font-black text-[#1F2937]">{data?.stats?.progress || 0}%</span>
                        </div>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">Plan Completion</div>
                    </div>

                    {/* XP / Mastery */}
                    <div className="bg-indigo-600 p-6 rounded-[32px] shadow-lg shadow-indigo-200 flex flex-col items-center justify-center text-center h-48 text-white relative overflow-hidden">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-3 backdrop-blur-sm">
                            <Target size={24} fill="currentColor" />
                        </div>
                        <div className="text-4xl font-black mb-1">{data?.stats?.xp || 0}</div>
                        <div className="text-xs font-bold text-white/60 uppercase tracking-wide">Mastery XP</div>
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
                    No recent sessions. Completing a mission will trigger your streak.
                </div>
            </div>

        </div>
    );
}
