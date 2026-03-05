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
        const params = new URLSearchParams(window.location.search);
        if (params.get('mode') === 'signup' || params.get('signup') === '1') {
            setIsLogin(false);
        }
    }, []);

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
        <div className="min-h-screen w-full bg-[#F3F4F6] selection:bg-[#4C8233] selection:text-white">
            <div className="grid min-h-screen w-full lg:grid-cols-2">
                <section className="relative hidden lg:flex overflow-hidden border-r border-[#3D6A29]/20 bg-gradient-to-br from-[#2F4F2F] to-[#4C8233] text-white">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(255,255,255,0.18),transparent_45%)]" />
                    <div className="absolute -bottom-24 -left-10 h-80 w-80 rounded-full bg-[#4C8233]/20 blur-3xl" />

                    <div className="relative z-10 flex h-full w-full flex-col justify-between p-12">
                        <div>
                            <div className="inline-flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/25 text-sm font-bold">S</div>
                                <span className="text-xl font-extrabold tracking-tight">gostuddy</span>
                            </div>

                            <h2 className="mt-10 max-w-xl text-5xl font-black leading-[1.02]">
                                {isLogin ? 'Welcome Back' : 'Welcome'}
                            </h2>
                            <div className="mt-8 h-2.5 w-40 rounded-full bg-white/35" />
                            <p className="mt-10 max-w-lg text-4xl leading-relaxed text-white/75">
                                {isLogin ? 'Sign in to continue to your account' : 'Sign up to create your account'}
                            </p>
                        </div>

                        <div />
                    </div>
                </section>

                <section className="relative flex min-h-screen items-center bg-[#F8F9FA] px-5 py-10 md:px-10 lg:px-14">
                    <div className="pointer-events-none absolute -top-20 -right-24 h-64 w-64 rounded-full bg-[#4C8233]/15 blur-3xl" />

                    <div className="relative z-10 mx-auto w-full max-w-xl rounded-[30px] border border-gray-100 bg-white p-6 shadow-2xl shadow-black/5 md:p-8">
                        <div className="mb-8 flex items-start justify-between gap-4">
                            <div>
                                <div className="mb-4 flex items-center gap-3 lg:hidden">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#4C8233] text-sm font-bold text-white">S</div>
                                    <span className="text-xl font-extrabold tracking-tight text-[#2F4F2F]">gostuddy</span>
                                </div>
                                <h1 className="text-3xl font-black text-[#111827]">
                                    {isLogin ? 'Sign In' : 'Sign Up'}
                                </h1>
                                <p className="mt-2 text-sm font-medium text-gray-500">
                                    {isLogin ? 'Enter your details to continue' : 'Enter your details to create account'}
                                </p>
                            </div>
                            <div className="inline-flex rounded-2xl border border-gray-200 bg-gray-50 p-1.5">
                                <button
                                    type="button"
                                    onClick={() => setIsLogin(true)}
                                    className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${isLogin ? 'bg-white text-[#1F2937] shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                                >
                                    SIGN IN
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsLogin(false)}
                                    className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${!isLogin ? 'bg-white text-[#1F2937] shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                                >
                                    SIGN UP
                                </button>
                            </div>
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
                                        placeholder="Enter your name"
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
                                placeholder="Enter your email"
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
                                    placeholder="Enter your password"
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
                            <LoginButton label={isLogin ? 'Sign in' : 'Sign up'} />
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
                                    Forgot Password?
                                </Link>
                            </div>
                        )}
                    </form>

                    <div className="my-5 flex items-center gap-3 text-xs font-bold uppercase tracking-wide text-gray-400">
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
                        Sign in with Google
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
