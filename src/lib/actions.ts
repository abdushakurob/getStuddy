'use server';

import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import dbConnect from './db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { sendResetPasswordEmail, sendVerificationEmail, verifyAuthToken } from './auth-email';

export type AuthActionState = {
    status: 'idle' | 'success' | 'error';
    message?: string;
    code?: 'EMAIL_NOT_VERIFIED' | 'GENERIC_ERROR' | 'SUCCESS';
    email?: string;
};

export async function authenticate(prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
    const email = String(formData.get('email') || '').toLowerCase().trim();
    const password = String(formData.get('password') || '');

    if (!email || !password) {
        return { status: 'error', code: 'GENERIC_ERROR', message: 'Email and password are required.' };
    }

    await dbConnect();
    const user = await User.findOne({ email }).select('+password emailVerified').lean();

    if (!user || !user.password) {
        return { status: 'error', code: 'GENERIC_ERROR', message: 'Invalid credentials.' };
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
        return { status: 'error', code: 'GENERIC_ERROR', message: 'Invalid credentials.' };
    }

    if (!user.emailVerified) {
        return {
            status: 'error',
            code: 'EMAIL_NOT_VERIFIED',
            email,
            message: 'Please verify your email before logging in.'
        };
    }

    try {
        await signIn('credentials', formData);
        return { status: 'success', code: 'SUCCESS' };
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return { status: 'error', code: 'GENERIC_ERROR', message: 'Invalid credentials.' };
                default:
                    return { status: 'error', code: 'GENERIC_ERROR', message: 'Something went wrong.' };
            }
        }
        throw error;
    }
}

export async function register(prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
    const name = formData.get('name') as string;
    const email = (formData.get('email') as string)?.toLowerCase().trim();
    const password = formData.get('password') as string;

    if (!email || !password || !name) return { status: 'error', code: 'GENERIC_ERROR', message: 'Missing fields' };

    await dbConnect();

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return { status: 'error', code: 'GENERIC_ERROR', message: 'User already exists.' };

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User
    const createdUser = await User.create({
        name,
        email,
        password: hashedPassword,
        emailVerified: null,
        xp: 0,
        level: 1,
        credits: 100
    });

    await sendVerificationEmail(createdUser._id.toString());

    return {
        status: 'success',
        code: 'SUCCESS',
        message: 'Account created. Check your email to verify your account before logging in.'
    };
}

export async function handleAuth(prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
    const mode = formData.get('mode');
    if (mode === 'login') {
        return authenticate(prevState, formData);
    } else {
        return register(prevState, formData);
    }
}

export async function resendVerificationEmail(prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
    const email = String(formData.get('email') || '').toLowerCase().trim();
    if (!email) return { status: 'error', code: 'GENERIC_ERROR', message: 'Email is required.' };

    await dbConnect();
    const user = await User.findOne({ email }).select('_id emailVerified').lean();
    if (!user) return { status: 'success', code: 'SUCCESS', message: 'If the account exists, a verification email has been sent.' };
    if (user.emailVerified) return { status: 'success', code: 'SUCCESS', message: 'Email is already verified. You can log in.' };

    await sendVerificationEmail(user._id.toString());
    return { status: 'success', code: 'SUCCESS', message: 'Verification email sent.' };
}

export async function requestPasswordReset(prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
    const email = String(formData.get('email') || '').toLowerCase().trim();
    if (!email) return { status: 'error', code: 'GENERIC_ERROR', message: 'Email is required.' };

    await sendResetPasswordEmail(email);
    return { status: 'success', code: 'SUCCESS', message: 'If this email exists, a reset link has been sent.' };
}

export async function confirmEmailVerification(rawToken: string): Promise<AuthActionState> {
    if (!rawToken) return { status: 'error', code: 'GENERIC_ERROR', message: 'Invalid verification link.' };

    const tokenDoc = await verifyAuthToken(rawToken, 'verify_email');
    if (!tokenDoc) return { status: 'error', code: 'GENERIC_ERROR', message: 'Verification link is invalid or expired.' };

    await dbConnect();
    await User.findByIdAndUpdate(tokenDoc.userId, {
        $set: { emailVerified: new Date() }
    });

    return { status: 'success', code: 'SUCCESS', message: 'Email verified successfully. You can now log in.' };
}

export async function resetPasswordWithToken(prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
    const token = String(formData.get('token') || '');
    const password = String(formData.get('password') || '');
    const confirmPassword = String(formData.get('confirmPassword') || '');

    if (!token) return { status: 'error', code: 'GENERIC_ERROR', message: 'Invalid reset link.' };
    if (password.length < 6) return { status: 'error', code: 'GENERIC_ERROR', message: 'Password must be at least 6 characters.' };
    if (password !== confirmPassword) return { status: 'error', code: 'GENERIC_ERROR', message: 'Passwords do not match.' };

    const tokenDoc = await verifyAuthToken(token, 'reset_password');
    if (!tokenDoc) return { status: 'error', code: 'GENERIC_ERROR', message: 'Reset link is invalid or expired.' };

    const hashedPassword = await bcrypt.hash(password, 10);
    await dbConnect();
    await User.findByIdAndUpdate(tokenDoc.userId, {
        $set: { password: hashedPassword }
    });

    return { status: 'success', code: 'SUCCESS', message: 'Password reset successful. You can now log in.' };
}
