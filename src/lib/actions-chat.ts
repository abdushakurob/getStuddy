'use server';

import { auth } from '@/auth';
import dbConnect from './db';
import Message from '@/models/Message';
import Resource from '@/models/Resource';
import { chatWithAgent } from './gemini';
import { revalidatePath } from 'next/cache';

export async function getChatHistory(courseId: string) {
    const session = await auth();
    if (!session?.user?.id) return [];

    await dbConnect();
    const messages = await Message.find({
        courseId,
        userId: session.user.id
    }).sort({ createdAt: 1 }).lean();

    return messages.map((m: any) => ({
        id: m._id.toString(),
        role: m.role,
        content: m.content,
        createdAt: m.createdAt
    }));
}

export async function sendMessage(courseId: string, content: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    await dbConnect();

    // 1. Save User Message
    const userMsg = await Message.create({
        courseId,
        userId: session.user.id,
        role: 'user',
        content
    });

    // 2. Fetch Context (Recent Resources)
    // We grab the text from the top 3 resources to give the agent context
    // In a real app, uses RAG. Here we blindly stuff context (Alpha).
    const resources = await Resource.find({ courseId, userId: session.user.id })
        .sort({ createdAt: -1 })
        .limit(3)
        .select('extractedText title')
        .lean();

    const contextText = resources.map((r: any) => `[Document: ${r.title}]\n${r.extractedText?.substring(0, 5000)}`).join("\n\n");

    // 3. Fetch History (Last 10 messages)
    const history = await Message.find({ courseId, userId: session.user.id })
        .sort({ createdAt: -1 }) // Get newest first
        .limit(10)
        .lean();

    // Reverse for API (Oldest first)
    const geminiHistory = history.reverse().map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
    }));

    // 4. Call Gemini
    const aiResponseText = await chatWithAgent(content, geminiHistory, contextText);

    // 5. Save AI Message
    const aiMsg = await Message.create({
        courseId,
        userId: session.user.id,
        role: 'assistant',
        content: aiResponseText
    });

    revalidatePath(`/dashboard/courses/${courseId}`);

    return {
        userMessage: { id: userMsg._id.toString(), role: 'user', content: userMsg.content },
        aiMessage: { id: aiMsg._id.toString(), role: 'assistant', content: aiMsg.content }
    };
}
