import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { authConfig } from './auth.config';
import { z } from 'zod';
import dbConnect from './lib/db';
import User from './models/User';
import bcrypt from 'bcryptjs';

async function getUser(email: string) {
    try {
        await dbConnect();
        const user = await User.findOne({ email }).select('+password emailVerified').lean();
        return user;
    } catch (error) {
        console.error('Failed to fetch user:', error);
        throw new Error('Failed to fetch user.');
    }
}

async function getOrCreateOAuthUser(params: { email: string; name?: string | null; image?: string | null }) {
    const { email, name, image } = params;
    await dbConnect();

    let user = await User.findOne({ email }).lean();

    if (!user) {
        user = await User.create({
            email,
            name: name || email.split('@')[0],
            avatarUrl: image || undefined,
            emailVerified: new Date(),
            xp: 0,
            level: 1,
            credits: 100
        });
    } else if (name || image) {
        await User.updateOne(
            { _id: user._id },
            {
                $set: {
                    ...(name ? { name } : {}),
                    ...(image ? { avatarUrl: image } : {}),
                    emailVerified: user.emailVerified || new Date()
                }
            }
        );
    }

    return user._id.toString();
}

export const { auth, signIn, signOut, handlers } = NextAuth({
    ...authConfig,
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
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

                    if (!user.emailVerified) return null;

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
        async jwt({ token, user, account }) {
            if (account?.provider === 'google' && user?.email) {
                const mongoUserId = await getOrCreateOAuthUser({
                    email: user.email,
                    name: user.name,
                    image: user.image,
                });

                token.id = mongoUserId;
                token.picture = user.image;
                token.name = user.name;
                token.email = user.email;
                return token;
            }

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
