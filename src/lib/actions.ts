'use server';

import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import dbConnect from './db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function authenticate(prevState: string | undefined, formData: FormData) {
    try {
        await signIn('credentials', formData);
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid credentials.';
                default:
                    return 'Something went wrong.';
            }
        }
        throw error;
    }
}

export async function register(prevState: string | undefined, formData: FormData) {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password || !name) return 'Missing fields';

    await dbConnect();

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return 'User already exists.';

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User
    await User.create({
        name,
        email,
        password: hashedPassword,
        xp: 0,
        level: 1,
        credits: 100
    });

    // Auto login
    try {
        await signIn('credentials', formData);
    } catch (error) {
        if (error instanceof AuthError) {
            return 'Account created but login failed.';
        }
        throw error;
    }
}

export async function handleAuth(prevState: string | undefined, formData: FormData) {
    const mode = formData.get('mode');
    if (mode === 'login') {
        return authenticate(prevState, formData);
    } else {
        return register(prevState, formData);
    }
}
