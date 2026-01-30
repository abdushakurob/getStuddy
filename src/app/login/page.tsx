'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { authenticate, register } from '@/lib/actions';
import { useState } from 'react';
import { ArrowRight, Bot, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [errorMessage, dispatch, isPending] = useActionState(isLogin ? authenticate : register, undefined);

    const toggleMode = () => {
        setIsLogin(!isLogin);
        // Reset specific error states if needed, though useFormState persist might need caution.
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6] p-6 selection:bg-[#4C8233] selection:text-white">
            <div className="w-full max-w-md">

                {/* Brand Header */}
                <div className="flex justify-center mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#4C8233] flex items-center justify-center text-white font-bold text-lg">S</div>
                        <span className="font-extrabold text-2xl tracking-tight text-[#2F4F2F]">getStuddy</span>
                    </div>
                </div>

                {/* Glass Card */}
                <div className="glass-panel p-8 rounded-[32px] bg-white shadow-xl shadow-[#4C8233]/10 relative overflow-hidden">

                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-black text-[#1F2937] mb-2">
                            {isLogin ? 'Welcome Back, Agent.' : 'Initialize Profile'}
                        </h1>
                        <p className="text-gray-500 font-medium text-sm">
                            {isLogin ? 'Resume your mission.' : 'Your companion is waiting.'}
                        </p>
                    </div>

                    <form action={dispatch} className="space-y-4">
                        {!isLogin && (
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-2">Codename (Name)</label>
                                <input name="name" type="text" placeholder="e.g. Agent Smith" className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:outline-none focus:border-[#4C8233] font-bold text-[#1F2937] placeholder-gray-400 transition-colors" required />
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-2">Email</label>
                            <input name="email" type="email" placeholder="agent@hq.com" className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:outline-none focus:border-[#4C8233] font-bold text-[#1F2937] placeholder-gray-400 transition-colors" required />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-2">Password</label>
                            <input name="password" type="password" placeholder="••••••••" className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:outline-none focus:border-[#4C8233] font-bold text-[#1F2937] placeholder-gray-400 transition-colors" required minLength={6} />
                        </div>

                        <div className="pt-4">
                            <LoginButton label={isLogin ? 'Access Dashboard' : 'Deploy Agent'} />
                        </div>

                        {errorMessage && (
                            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold text-center border border-red-100 animate-in fade-in slide-in-from-top-1">
                                {errorMessage}
                            </div>
                        )}
                    </form>

                    <div className="mt-8 text-center">
                        <button onClick={toggleMode} className="text-sm font-bold text-gray-400 hover:text-[#4C8233] transition-colors">
                            {isLogin ? "New recruit? Deploy Agent" : "Already active? Login"}
                        </button>
                    </div>

                    {/* Decorative Blob */}
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#4C8233]/10 rounded-full blur-3xl pointer-events-none"></div>
                </div>
            </div>
        </div>
    );
}

function LoginButton({ label }: { label: string }) {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full py-4 bg-[#4C8233] text-white rounded-2xl font-bold shadow-lg shadow-[#4C8233]/30 hover:bg-[#3D6A29] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {pending ? <Loader2 className="animate-spin" /> : <>{label} <ArrowRight size={20} /></>}
        </button>
    )
}
