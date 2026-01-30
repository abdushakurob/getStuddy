'use client';

import { usePathname } from 'next/navigation';
import {
    Map, MessageSquare, Trophy, Zap,
    Flame, Star, Coins, Menu, Bell, Search, User
} from 'lucide-react';
import { useGameStore } from '@/lib/store';
import { useState } from 'react';

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
    const { user } = useGameStore();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className="flex h-screen bg-[#F3F4F6] text-[#1F2937] font-[family-name:var(--font-plus-jakarta)] overflow-hidden">

            {/* --- SIDEBAR (Floating & Soft) --- */}
            <aside className={`${sidebarOpen ? 'w-72' : 'w-24'} transition-all duration-300 p-4 flex flex-col z-20`}>
                <div className="flex-1 bg-white rounded-[32px] shadow-sm border border-gray-100 flex flex-col p-6">

                    {/* Logo Area */}
                    <div className="flex items-center gap-3 mb-10 pl-2">
                        <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white font-bold text-lg">S</div>
                        {sidebarOpen && <span className="font-bold text-xl tracking-tight">getStuddy</span>}
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-3">
                        <NavButton icon={<MessageSquare size={22} />} label="Course Chat" active />
                        <NavButton icon={<Map size={22} />} label="My Syllabus" />
                        <NavButton icon={<Zap size={22} />} label="Quick Drill" />
                        <NavButton icon={<Trophy size={22} />} label="Leaderboard" />
                    </nav>

                    {/* Bottom Actions */}
                    <div className="pt-6 border-t border-gray-100 space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                                {user.level}
                            </div>
                            {sidebarOpen && (
                                <div>
                                    <div className="text-xs font-bold text-gray-400 uppercase">Current Level</div>
                                    <div className="font-bold text-sm">Scholar Lvl. {user.level}</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </aside>

            {/* --- MAIN CONTENT AREA --- */}
            <div className="flex-1 flex flex-col p-4 pl-0 relative">

                {/* Top Header (Glassy) */}
                <header className="h-20 flex items-center justify-between px-8 mb-4">

                    {/* Search Bar */}
                    <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-full shadow-sm border border-gray-100 w-96">
                        <Search size={18} className="text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search your notes..."
                            className="bg-transparent outline-none text-sm font-medium w-full placeholder-gray-400"
                        />
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-6">
                        {/* Streak Pill */}
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
                            <Flame size={18} className="text-orange-500 fill-orange-500" />
                            <span className="font-bold text-sm">{user.streak.count} Day Streak</span>
                        </div>

                        <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 text-gray-500 hover:text-black transition-colors">
                            <Bell size={20} />
                        </button>

                        <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                            <User size={20} />
                        </div>
                    </div>
                </header>

                {/* The Workspace Canvas */}
                <main className="flex-1 bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden relative">
                    {children}
                </main>
            </div>
        </div>
    );
}

// --- Subcomponents ---

function NavButton({ icon, label, active }: { icon: React.ReactNode, label: string, active?: boolean }) {
    return (
        <button className={`flex items-center gap-4 w-full p-3.5 rounded-2xl transition-all ${active
            ? 'bg-black text-white shadow-lg shadow-gray-200'
            : 'text-gray-500 hover:bg-gray-50 hover:text-black'
            }`}>
            <div>{icon}</div>
            <span className="font-medium whitespace-nowrap">{label}</span>
        </button>
    );
}
