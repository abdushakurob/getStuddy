'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { AuthActionState, resetPasswordWithToken } from '@/lib/actions';
import { Loader2 } from 'lucide-react';

type ResetPasswordFormProps = {
    token: string;
};

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
    const [state, action] = useActionState<AuthActionState, FormData>(resetPasswordWithToken, { status: 'idle' });

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6] p-6">
            <div className="w-full max-w-md bg-white rounded-[28px] p-8 shadow-lg border border-gray-100">
                <h1 className="text-2xl font-black text-[#1F2937] mb-2">Reset password</h1>
                <p className="text-sm text-gray-500 mb-6">Choose a new password for your account.</p>

                <form action={action} className="space-y-4">
                    <input type="hidden" name="token" value={token} />

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">New Password</label>
                        <input
                            name="password"
                            type="password"
                            minLength={6}
                            required
                            className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:outline-none focus:border-[#4C8233] font-semibold text-[#1F2937]"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Confirm Password</label>
                        <input
                            name="confirmPassword"
                            type="password"
                            minLength={6}
                            required
                            className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:outline-none focus:border-[#4C8233] font-semibold text-[#1F2937]"
                        />
                    </div>

                    <ResetPasswordSubmitButton />
                </form>

                {state.message && (
                    <div className={`mt-4 p-3 rounded-xl text-sm font-semibold ${state.status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                        {state.message}
                    </div>
                )}

                <div className="mt-6 text-center text-sm">
                    <Link href="/login" className="font-bold text-gray-500 hover:text-[#4C8233]">Back to login</Link>
                </div>
            </div>
        </div>
    );
}

function ResetPasswordSubmitButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full py-3.5 bg-[#4C8233] text-white rounded-2xl font-bold hover:bg-[#3D6A29] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {pending ? 'Resetting...' : 'Reset password'}
        </button>
    );
}
