import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { z } from 'zod';
import dbConnect from './lib/db';
import User from './models/User';
import bcrypt from 'bcryptjs';

async function getUser(email: string) {
    try {
        await dbConnect();
        const user = await User.findOne({ email }).select('+password').lean();
        return user;
    } catch (error) {
        console.error('Failed to fetch user:', error);
        throw new Error('Failed to fetch user.');
    }
}

export const { auth, signIn, signOut, handlers } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    const user = await getUser(email);
                    if (!user) return null;

                    // Note: If user has no password (e.g. OAuth), handled here
                    if (!user.password) return null;

                    const passwordsMatch = await bcrypt.compare(password, user.password);
                    if (passwordsMatch) {
                        // Return simple object with string ID
                        return {
                            id: user._id.toString(),
                            name: user.name,
                            email: user.email,
                            image: user.avatarUrl,
                            // Add other fields to session if needed later
                        };
                    }
                }

                console.log('Invalid credentials');
                return null;
            },
        }),

    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.picture = user.image;
                token.name = user.name;
            }
            return token;
        },
        async session({ session, token }) {
            if (token?.id && session.user) {
                session.user.id = token.id as string;
                session.user.name = token.name;
                session.user.image = token.picture;
            }
            return session;
        },
    },
});
