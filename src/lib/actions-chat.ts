
'use server';

import { auth } from '@/auth';
import dbConnect from './db';
import Message from '@/models/Message';
import Resource from '@/models/Resource';
import StudyPlan from '@/models/StudyPlan';
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
    const resources = await Resource.find({ courseId, userId: session.user.id })
        .sort({ createdAt: -1 })
        .limit(3)
        .select('knowledgeBase title')
        .lean();

    const contextText = resources.map((r: any) => `[Document: ${r.title}]\n${r.knowledgeBase?.substring(0, 5000)}`).join("\n\n");

    // 3. Fetch History
    const history = await Message.find({ courseId, userId: session.user.id })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

    const geminiHistory = history.reverse().map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
    }));

    // 4. Call Gemini (Now returns an object, not just string)
    // @ts-ignore
    const aiResponse = await chatWithAgent(content, geminiHistory, contextText);

    let finalAiText = "";

    // 5. Handle Tool Calls
    if (aiResponse.type === 'tool_call' && aiResponse.toolName === 'commit_study_plan') {
        console.log("🛠️ EXECUTING TOOL: commit_study_plan", aiResponse.args);
        const args = aiResponse.args;

        // A: Save the Plan to DB
        // Map the generic 'tasks' to our Schema's 'schedule'
        const schedule = args.tasks.map((t: any) => ({
            date: new Date(t.dateString),
            topicName: t.topicName,
            activityType: t.activityType || 'read',
            status: 'pending',
            reasoning: t.reasoning
        }));

        await StudyPlan.create({
            courseId,
            userId: session.user.id,
            goal: args.goal,
            phase: args.phase,
            schedule: schedule,
            status: 'active'
        });

        finalAiText = `✅ **Plan Locked!**\n\nI have saved your "${args.phase}" strategy to the Mission Control.\n\nYour first mission is: **${schedule[0].topicName}** on ${args.tasks[0].dateString}.\n\n(Go to the Dashboard to start)`;
    } else if (aiResponse.type === 'tool_call') {
        finalAiText = "I tried to use a tool I don't know yet.";
    } else {
        // Normal text
        finalAiText = aiResponse.content;
    }

    // 6. Save AI Message
    const aiMsg = await Message.create({
        courseId,
        userId: session.user.id,
        role: 'assistant',
        content: finalAiText
    });

    revalidatePath(`/dashboard/courses/${courseId}`);

    return {
        userMessage: { id: userMsg._id.toString(), role: 'user', content: userMsg.content },
        aiMessage: { id: aiMsg._id.toString(), role: 'assistant', content: aiMsg.content }
    };
}
