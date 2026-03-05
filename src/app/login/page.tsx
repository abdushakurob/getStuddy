'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { AuthActionState, handleAuth, resendVerificationEmail } from '@/lib/actions';
import { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [authState, dispatch] = useActionState<AuthActionState, FormData>(handleAuth, { status: 'idle' });
    const [resendState, resendDispatch] = useActionState<AuthActionState, FormData>(resendVerificationEmail, { status: 'idle' });
    const [googlePending, setGooglePending] = useState(false);

    const toggleMode = () => {
        setIsLogin(!isLogin);
        // Reset specific error states if needed, though useFormState persist might need caution.
    };

    const handleGoogleSignIn = async () => {
        try {
            setGooglePending(true);
            await signIn('google', { callbackUrl: '/dashboard' });
        } finally {
            setGooglePending(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6] p-6 selection:bg-[#4C8233] selection:text-white">
            <div className="w-full max-w-md">

                {/* Brand Header */}
                <div className="flex justify-center mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#4C8233] flex items-center justify-center text-white font-bold text-lg">S</div>
                        <span className="font-extrabold text-2xl tracking-tight text-[#2F4F2F]">gostuddy</span>
                    </div>
                </div>

                {/* Glass Card */}
                <div className="glass-panel p-8 rounded-[32px] bg-white shadow-xl shadow-[#4C8233]/10 relative overflow-hidden">

                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-black text-[#1F2937] mb-2">
                            {isLogin ? 'Welcome Back.' : 'Create Profile'}
                        </h1>
                        <p className="text-gray-500 font-medium text-sm">
                            {isLogin ? 'Resume your learning.' : 'Your companion is waiting.'}
                        </p>
                    </div>

                    <form action={dispatch} className="space-y-4">
                        <input type="hidden" name="mode" value={isLogin ? 'login' : 'register'} />
                        {!isLogin && (
                            <div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-2">Name</label>
                                    <input name="name" type="text" placeholder="e.g. Alex Smith" className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:outline-none focus:border-[#4C8233] font-bold text-[#1F2937] placeholder-gray-400 transition-colors" required />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-2">Email</label>
                            <input name="email" type="email" placeholder="student@example.com" className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:outline-none focus:border-[#4C8233] font-bold text-[#1F2937] placeholder-gray-400 transition-colors" required />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-2">Password</label>
                            <input name="password" type="password" placeholder="••••••••" className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:outline-none focus:border-[#4C8233] font-bold text-[#1F2937] placeholder-gray-400 transition-colors" required minLength={6} />
                        </div>

                        <div className="pt-4">
                            <LoginButton label={isLogin ? 'Access Dashboard' : 'Start Learning'} />
                        </div>

                        {authState.message && (
                            <div className={`p-4 rounded-xl text-sm font-bold text-center border animate-in fade-in slide-in-from-top-1 ${authState.status === 'success'
                                    ? 'bg-green-50 text-green-700 border-green-100'
                                    : 'bg-red-50 text-red-600 border-red-100'
                                }`}>
                                {authState.message}
                            </div>
                        )}

                        {isLogin && (
                            <div className="flex items-center justify-between text-xs pt-1">
                                <Link href="/forgot-password" className="font-bold text-gray-500 hover:text-[#4C8233] transition-colors">
                                    Forgot password?
                                </Link>
                            </div>
                        )}
                    </form>

                    <div className="my-5 flex items-center gap-3 text-xs font-bold text-gray-400 uppercase tracking-wide">
                        <span className="h-px flex-1 bg-gray-100" />
                        <span>or</span>
                        <span className="h-px flex-1 bg-gray-100" />
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={googlePending}
                        className="w-full py-3.5 bg-white text-[#1F2937] rounded-2xl font-bold border border-gray-200 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {googlePending ? <Loader2 className="animate-spin" /> : <span className="text-base">G</span>}
                        Continue with Google
                    </button>

                    {isLogin && (
                        <form action={resendDispatch} className="mt-4 space-y-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase ml-1">Didn&apos;t receive verification email?</label>
                            <div className="flex gap-2">
                                <input
                                    name="email"
                                    type="email"
                                    placeholder="student@example.com"
                                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 focus:outline-none focus:border-[#4C8233] text-sm font-semibold text-[#1F2937] placeholder-gray-400 transition-colors"
                                    required
                                />
                                <button
                                    type="submit"
                                    className="px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50"
                                >
                                    Resend
                                </button>
                            </div>
                            {resendState.message && (
                                <p className={`text-xs font-semibold ${resendState.status === 'success' ? 'text-green-700' : 'text-red-600'}`}>
                                    {resendState.message}
                                </p>
                            )}
                        </form>
                    )}

                    <div className="mt-8 text-center">
                        <button onClick={toggleMode} className="text-sm font-bold text-gray-400 hover:text-[#4C8233] transition-colors">
                            {isLogin ? "New here? Create Profile" : "Already have an account? Login"}
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
