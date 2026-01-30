'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FolderOpen, Settings, LogOut } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="flex h-screen bg-[#F3F4F6] text-[#1F2937] font-[family-name:var(--font-plus-jakarta)]">

            {/* Sidebar (Floating & Soft) */}
            <aside className="w-72 m-4 p-6 bg-white rounded-[32px] shadow-sm border border-gray-100 flex flex-col">
                <div className="mb-10 flex items-center gap-3 px-2">
                    <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white font-bold text-lg">S</div>
                    <span className="text-xl font-bold tracking-tight">getStuddy</span>
                </div>

                <nav className="flex-1 space-y-3">
                    <NavItem href="/dashboard" icon={<LayoutDashboard size={20} />} label="Overview" active={pathname === '/dashboard'} />
                    <NavItem href="/dashboard/courses" icon={<FolderOpen size={20} />} label="My Courses" active={pathname.startsWith('/dashboard/courses')} />
                    <NavItem href="/dashboard/upload" icon={<FolderOpen size={20} />} label="Upload Intel" active={pathname === '/dashboard/upload'} />
                    <NavItem href="/dashboard/settings" icon={<Settings size={20} />} label="Settings" active={pathname === '/dashboard/settings'} />
                </nav>

                <button className="flex items-center gap-4 px-4 py-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-colors font-medium">
                    <LogOut size={20} />
                    <span>Sign Out</span>
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 m-4 ml-0 overflow-auto bg-white rounded-[32px] shadow-sm border border-gray-100 relative">
                {children}
            </main>
        </div>
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
