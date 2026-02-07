import { auth } from '@/auth';
import { User, Settings, Bell, Shield, LogOut } from 'lucide-react';
import { signOut } from '@/auth'; // Adjust if using client-side signOut, but this is a server component page, so we need a client component for buttons or form actions. 
// Actually, for settings, interaction is needed. Let's make it a server component that renders client parts or just simple informative for now as requested "minimal".
import { redirect } from 'next/navigation';

export default async function SettingsPage() {
    const session = await auth();
    const user = session?.user;

    if (!user) redirect('/login');

    return (
        <div className="h-full flex flex-col p-8 overflow-y-auto max-w-3xl mx-auto w-full">
            <h1 className="text-3xl font-black text-[#1F2937] mb-8 flex items-center gap-3">
                <Settings size={32} className="text-[#4C8233]" />
                Settings
            </h1>

            {/* Profile Section */}
            <section className="mb-8">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Profile</h2>
                <div className="bg-white rounded-[24px] border border-gray-100 p-6 flex items-center gap-6 shadow-sm">
                    <div className="w-20 h-20 rounded-full bg-[#4C8233] flex items-center justify-center text-white font-black text-3xl shadow-lg shadow-[#4C8233]/20">
                        {user.name?.[0] || 'U'}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">{user.name}</h3>
                        <p className="text-gray-500 font-medium">{user.email}</p>
                        <button className="mt-3 text-sm font-bold text-[#4C8233] hover:underline">Edit Profile</button>
                    </div>
                </div>
            </section>

            {/* Preferences Stub */}
            <section className="mb-8">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">App Preferences</h2>
                <div className="bg-white rounded-[24px] border border-gray-100 overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                <Bell size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-800">Notifications</h4>
                                <p className="text-xs text-gray-500">Manage email and push alerts</p>
                            </div>
                        </div>
                        <span className="text-gray-400">On</span>
                    </div>
                    <div className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                                <Shield size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-800">Privacy & Security</h4>
                                <p className="text-xs text-gray-500">Password and data settings</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="text-center mt-8 text-gray-400 text-xs">
                <p>Studdy v1.0.0 • Accompanied by Intelligence</p>
            </div>
        </div>
    );
}
