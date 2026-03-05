'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { AuthActionState, handleAuth, resendVerificationEmail } from '@/lib/actions';
import { useEffect, useState, useTransition } from 'react';
import { ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [authState, dispatch] = useActionState<AuthActionState, FormData>(handleAuth, { status: 'idle' });
    const [resendState, resendDispatch] = useActionState<AuthActionState, FormData>(resendVerificationEmail, { status: 'idle' });
    const [googlePending, setGooglePending] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [isResending, startResending] = useTransition();

    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setInterval(() => {
            setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [resendCooldown]);

    const startResendCooldown = () => {
        if (resendCooldown === 0) {
            setResendCooldown(45);
        }
    };

    const handleResendVerification = () => {
        if (!authState.email || resendCooldown > 0 || isResending) return;

        startResending(() => {
            const formData = new FormData();
            formData.set('email', authState.email!);
            resendDispatch(formData);
        });

        startResendCooldown();
    };

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
        <div className="min-h-screen bg-gradient-to-b from-[#eef3ef] to-[#f8f9fa] selection:bg-[#4C8233] selection:text-white px-4 py-8 md:px-8 md:py-10">
            <div className="mx-auto w-full max-w-7xl grid gap-7 lg:grid-cols-[1.15fr_0.85fr]">

                <section className="hidden lg:flex rounded-[36px] bg-[#111827] text-white p-10 xl:p-12 relative overflow-hidden border border-white/10">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(76,130,51,0.45),transparent_45%)]" />
                    <div className="absolute -bottom-20 -left-10 w-72 h-72 rounded-full bg-[#4C8233]/20 blur-3xl" />

                    <div className="relative z-10 flex w-full flex-col justify-between">
                        <div>
                            <div className="inline-flex items-center gap-3 rounded-2xl bg-white/10 border border-white/20 px-4 py-2.5">
                                <div className="w-8 h-8 rounded-lg bg-[#4C8233] flex items-center justify-center text-white font-bold text-sm">S</div>
                                <span className="font-extrabold text-xl tracking-tight">gostuddy</span>
                            </div>

                            <h2 className="mt-8 text-4xl xl:text-5xl font-black leading-[1.05] max-w-xl">
                                Learn with an AI partner that keeps you focused.
                            </h2>
                            <p className="mt-4 text-white/75 text-base max-w-lg leading-relaxed">
                                Studdy turns scattered materials into guided sessions, with context-aware help, resource navigation, and progress memory.
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-3 max-w-xl mt-10">
                            <div className="rounded-2xl bg-white/10 border border-white/15 p-4">
                                <p className="text-[11px] uppercase tracking-wide text-white/65">Sessions</p>
                                <p className="text-sm font-bold mt-1">Structured roadmap</p>
                            </div>
                            <div className="rounded-2xl bg-white/10 border border-white/15 p-4">
                                <p className="text-[11px] uppercase tracking-wide text-white/65">Resources</p>
                                <p className="text-sm font-bold mt-1">PDF + video aware</p>
                            </div>
                            <div className="rounded-2xl bg-white/10 border border-white/15 p-4">
                                <p className="text-[11px] uppercase tracking-wide text-white/65">Flow</p>
                                <p className="text-sm font-bold mt-1">Chat + action loop</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="rounded-[32px] bg-white shadow-2xl shadow-[#4C8233]/10 border border-gray-100 p-6 md:p-8 lg:p-10 relative overflow-hidden">
                    <div className="absolute -top-20 -right-24 w-56 h-56 bg-[#4C8233]/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 lg:hidden">
                                <div className="w-9 h-9 rounded-lg bg-[#4C8233] flex items-center justify-center text-white font-bold text-sm">S</div>
                                <span className="font-extrabold text-xl tracking-tight text-[#2F4F2F]">gostuddy</span>
                            </div>
                            <div className="w-full lg:w-auto">
                                <div className="inline-flex rounded-2xl border border-gray-200 bg-gray-50 p-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setIsLogin(true)}
                                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${isLogin ? 'bg-white text-[#1F2937] shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                                    >
                                        Log in
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsLogin(false)}
                                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${!isLogin ? 'bg-white text-[#1F2937] shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                                    >
                                        Sign up
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 mb-7">
                            <h1 className="text-3xl font-black text-[#111827]">
                                {isLogin ? 'Welcome back' : 'Create your account'}
                            </h1>
                            <p className="text-gray-500 mt-2 text-sm">
                                {isLogin ? 'Continue where you left off.' : 'Set up your account and start studying smarter.'}
                            </p>
                        </div>

                    <form action={dispatch} className="space-y-4.5">
                        <input type="hidden" name="mode" value={isLogin ? 'login' : 'register'} />
                        {!isLogin && (
                            <div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-2">Name</label>
                                    <input
                                        name="name"
                                        type="text"
                                        placeholder="e.g. Alex Smith"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:outline-none focus:border-[#4C8233] font-bold text-[#1F2937] placeholder-gray-400 transition-colors"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-2">Email</label>
                            <input
                                name="email"
                                type="email"
                                placeholder="student@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:outline-none focus:border-[#4C8233] font-bold text-[#1F2937] placeholder-gray-400 transition-colors"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-2">Password</label>
                            <div className="relative">
                                <input
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full p-4 pr-12 bg-gray-50 rounded-2xl border border-gray-100 focus:outline-none focus:border-[#4C8233] font-bold text-[#1F2937] placeholder-gray-400 transition-colors"
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className="absolute inset-y-0 right-0 px-4 text-gray-400 hover:text-gray-600"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="pt-4">
                            <LoginButton label={isLogin ? 'Access Dashboard' : 'Start Learning'} />
                        </div>

                        {authState.message && (
                            <div className={`p-4 rounded-xl text-sm font-bold border animate-in fade-in slide-in-from-top-1 ${authState.status === 'success'
                                    ? 'bg-green-50 text-green-700 border-green-100'
                                    : 'bg-red-50 text-red-600 border-red-100'
                                }`}>
                                <p className="text-center">{authState.message}</p>

                                {isLogin && authState.code === 'EMAIL_NOT_VERIFIED' && authState.email && (
                                    <div className="mt-3">
                                        <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-white/70 px-3 py-2.5">
                                            <span className="text-xs font-semibold text-red-700">Didn&apos;t receive verification email?</span>
                                            <ResendInlineButton
                                                onClick={handleResendVerification}
                                                pending={isResending}
                                                cooldown={resendCooldown}
                                            />
                                        </div>
                                    </div>
                                )}

                                {isLogin && authState.code === 'EMAIL_NOT_VERIFIED' && resendState.message && (
                                    <p className={`mt-2 text-xs font-semibold text-center ${resendState.status === 'success' ? 'text-green-700' : 'text-red-600'}`}>
                                        {resendState.message}
                                    </p>
                                )}
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

                    <div className="mt-6 text-center lg:hidden">
                        <button onClick={toggleMode} className="text-sm font-bold text-gray-400 hover:text-[#4C8233] transition-colors">
                            {isLogin ? 'New here? Create Profile' : 'Already have an account? Login'}
                        </button>
                    </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

function ResendInlineButton({
    onClick,
    pending,
    cooldown,
}: {
    onClick: () => void;
    pending: boolean;
    cooldown: number;
}) {
    const isDisabled = pending || cooldown > 0;

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={isDisabled}
            className="px-4 py-2.5 rounded-xl border border-red-200 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[86px]"
        >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : cooldown > 0 ? `${cooldown}s` : 'Resend'}
        </button>
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
