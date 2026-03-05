import Link from 'next/link';
import { confirmEmailVerification } from '@/lib/actions';

type Props = {
    searchParams: Promise<{ token?: string }>;
};

export default async function VerifyEmailPage({ searchParams }: Props) {
    const { token } = await searchParams;
    const result = await confirmEmailVerification(token || '');

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6] p-6">
            <div className="w-full max-w-md bg-white rounded-[28px] p-8 shadow-lg border border-gray-100 text-center">
                <h1 className="text-2xl font-black text-[#1F2937] mb-2">Email verification</h1>
                <p className={`text-sm font-semibold ${result.status === 'success' ? 'text-green-700' : 'text-red-600'}`}>
                    {result.message}
                </p>

                <div className="mt-6">
                    <Link href="/login" className="inline-block px-5 py-3 rounded-2xl bg-[#4C8233] text-white font-bold hover:bg-[#3D6A29] transition-colors">
                        Go to login
                    </Link>
                </div>
            </div>
        </div>
    );
}
