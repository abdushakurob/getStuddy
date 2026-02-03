import Sidebar from '@/components/dashboard/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {

    return (
        <div className="flex h-screen bg-[#F3F4F6] text-[#1F2937] font-[family-name:var(--font-plus-jakarta)]">

            {/* Sidebar (Floating & Soft) */}
            <Sidebar />

            {/* Main Content */}
            <main className="flex-1 m-4 ml-0 overflow-auto bg-white rounded-[32px] shadow-sm border border-gray-100 relative">
                {children}
            </main>
        </div>
    );
}
