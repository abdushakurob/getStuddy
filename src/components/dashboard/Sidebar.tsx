'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { LayoutDashboard, FolderOpen, Settings, LogOut, Disc, Play } from 'lucide-react';
import { getSidebarData } from '@/lib/actions-navigation';

export default function Sidebar() {
    const pathname = usePathname();
    const [missions, setMissions] = useState<any[]>([]);

    useEffect(() => {
        const loadMissions = async () => {
            const data = await getSidebarData();
            if (data?.activeMissions) {
                setMissions(data.activeMissions);
            }
        };
        loadMissions();
    }, []);

    return (
        <aside className="w-72 m-4 p-6 bg-white rounded-[32px] shadow-sm border border-gray-100 flex flex-col shrink-0">
            {/* Logo */}
            <div className="mb-10 flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white font-bold text-lg">S</div>
                <span className="text-xl font-bold tracking-tight">gostuddy</span>
            </div>

            {/* Core Nav */}
            <nav className="space-y-3 mb-8">
                <NavItem href="/dashboard" icon={<LayoutDashboard size={20} />} label="Overview" active={pathname === '/dashboard' || pathname === '/dashboard/'} />
                <NavItem href="/dashboard/courses" icon={<FolderOpen size={20} />} label="Library" active={pathname.startsWith('/dashboard/courses')} />
                <NavItem href="/dashboard/settings" icon={<Settings size={20} />} label="Settings" active={pathname === '/dashboard/settings'} />
            </nav>

            {/* YOUR MISSIONS (Active Plans) */}
            {missions.length > 0 && (
                <div className="flex-1 overflow-y-auto pr-2">
                    <p className="px-4 mb-3 text-xs font-bold text-gray-400 uppercase tracking-widest">Active Missions</p>
                    <div className="space-y-2">
                        {missions.map((m) => (
                            <Link
                                key={m.id}
                                href={`/dashboard/courses/${m.courseId}`}
                                className="group block p-3 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-gray-200 hover:shadow-sm transition-all"
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] uppercase font-bold text-gray-400 truncate max-w-[120px]">{m.phase}</span>
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                </div>
                                <h4 className="text-sm font-bold text-gray-800 leading-snug group-hover:text-black mb-1 line-clamp-2">
                                    {m.courseTitle}
                                </h4>
                                <p className="text-xs text-gray-500 truncate">{m.nextTask || "Continue Plan"}</p>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {!missions.length && <div className="flex-1" />}

            {/* Sign Out */}
            <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex items-center gap-4 px-4 py-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-colors font-medium mt-auto"
            >
                <LogOut size={20} />
                <span>Sign Out</span>
            </button>
        </aside>
    );
}

function NavItem({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all font-medium ${active
                ? 'bg-black text-white shadow-lg shadow-gray-200'
                : 'text-gray-500 hover:bg-gray-50 hover:text-black'
                }`}
        >
            {icon}
            <span>{label}</span>
        </Link>
    );
}
