
'use server';

import { auth } from '@/auth';
import dbConnect from './db';
import Message from '@/models/Message';
import Resource from '@/models/Resource';
import StudyPlan from '@/models/StudyPlan';
import { chatWithAgent } from './gemini';
import { startSession } from './actions-session';
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

    // 2. Fetch Context.
    // 1M context is more than enough for most courses.
    const resources = await Resource.find({ courseId, userId: session.user.id })
        .sort({ createdAt: -1 })
        .select('knowledgeBase title')
        .lean();

    // 2.5 Fetch GLOBAL CONTEXT (Other Active Plans)
    // This allows the Agent to know if the user is busy with other subjects.
    const otherPlans = await StudyPlan.find({
        userId: session.user.id,
        status: 'active',
        courseId: { $ne: courseId } // Don't include the current one if it exists (though usually it wouldn't match context)
    }).select('goal phase schedule').lean();

    let globalContext = "";
    if (otherPlans.length > 0) {
        globalContext = `\n\n[GLOBAL CONTEXT: OTHER ACTIVE PLANS]\nThe user has these other commitments:\n`;
        otherPlans.forEach((p: any) => {
            globalContext += `- Plan: ${p.phase} (Goal: ${p.goal}). Next Tasks:\n`;
            // Show next 3 tasks to keep it concise
            p.schedule.slice(0, 3).forEach((t: any) => {
                globalContext += `  * ${t.date.toISOString().split('T')[0]}: ${t.topicName}\n`;
            });
        });
    }

    const docContext = resources.map((r: any) => `[Document: ${r.title}]\n${r.knowledgeBase?.substring(0, 5000)}`).join("\n\n");
    const contextText = `${docContext}${globalContext}`;

    // 3. Fetch History

    // 3. Fetch History
    const history = await Message.find({ courseId, userId: session.user.id })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

    const geminiHistory = history.reverse().map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
    }));

    // Cal Gemini
    // @ts-ignore
    const aiResponse = await chatWithAgent(content, geminiHistory, contextText);

    let finalAiText = "";

    let committedPlan = null;
    let redirectUrl = null;

    // Handle Tool Calls
    if (aiResponse.type === 'tool_call' && aiResponse.toolName === 'commit_study_plan') {
        const args = aiResponse.args as any;

        // Map 'tasks' to schema 'schedule'
        const schedule = args.tasks.map((t: any) => ({
            date: new Date(t.dateString),
            topicName: t.topicName,
            activityType: t.activityType || 'read',
            status: 'pending',
            reasoning: t.reasoning
        }));

        const newPlan = await StudyPlan.create({
            courseId,
            userId: session.user.id,
            goal: args.goal,
            phase: args.phase,
            schedule: schedule,
            status: 'active'
        });

        const firstTask = schedule[0];
        let sessionId = "";

        try {
            sessionId = await startSession(courseId, newPlan._id.toString(), firstTask.topicName);
            redirectUrl = `/work/${sessionId}`;

            // Structured Data for the UI Card
            committedPlan = {
                phase: args.phase,
                goal: args.goal,
                nextTask: {
                    topic: firstTask.topicName,
                    date: args.tasks[0].dateString
                },
                startUrl: redirectUrl
            };

            finalAiText = `✅ **Plan Locked!**\n\nI have saved your strategy. You can start the mission below or continue chatting to adjust details.`;

        } catch (e) {
            console.error("Failed to auto-start session:", e);
            finalAiText = `✅ **Plan Locked!**\n\nI created the plan, but couldn't auto-start the session. Please check your Dashboard.`;
        }

    } else if (aiResponse.type === 'tool_call') {
        finalAiText = "I tried to use a tool I don't know yet.";
    } else {
        // Normal text (ensure string)
        finalAiText = typeof aiResponse.content === 'string' ? aiResponse.content : JSON.stringify(aiResponse.content);
    }

    // 6. Save AI Message
    const aiMsg = await Message.create({
        courseId,
        userId: session.user.id,
        role: 'assistant',
        content: finalAiText,
        // Optional: Save plan metadata in message if you extend schema
    });

    revalidatePath(`/dashboard/courses/${courseId}`);

    return {
        userMessage: { id: userMsg._id.toString(), role: 'user', content: userMsg.content },
        aiMessage: { id: aiMsg._id.toString(), role: 'assistant', content: aiMsg.content },
        committedPlan, // Send to Client
        redirectUrl
    };
}
