
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

    // Check existing messages
    const messages = await Message.find({
        courseId,
        userId: session.user.id
    }).sort({ createdAt: 1 }).lean();

    // If no messages exist, create the initial greeting
    if (messages.length === 0) {
        // Check resource status to determine greeting
        const resources = await Resource.find({
            courseId,
            userId: session.user.id
        }).select('status title').lean();

        const readyCount = resources.filter((r: any) => r.status === 'ready').length;
        const processingCount = resources.filter((r: any) => r.status === 'processing').length;
        const errorCount = resources.filter((r: any) => r.status === 'error').length;

        let greeting: string;

        if (resources.length === 0) {
            greeting = "Hey! I'm ready to help you plan your studies. 📚\n\nI noticed you haven't uploaded any materials yet. Once you add your PDFs, slides, or notes, I can create a personalized study plan based on exactly what you need to learn.\n\nWhat course is this for?";
        } else if (readyCount > 0) {
            greeting = `Hey! I've looked through your materials and I have some ideas. 📖\n\nI found ${readyCount} resource${readyCount > 1 ? 's' : ''} ready to work with. What's your main goal with this course?`;
        } else if (processingCount > 0) {
            greeting = `Hey! I see you've uploaded some files, but they're still being analyzed. ⏳\n\nGive it a minute and then we can plan once I can see what's in there. In the meantime, what are you hoping to achieve with this course?`;
        } else {
            greeting = `Hey! I noticed the file${errorCount > 1 ? 's' : ''} you uploaded couldn't be analyzed. 😕\n\nYou might want to go back and retry them, or upload different files. What course is this for?`;
        }

        // Save the greeting as the first message
        const greetingMsg = await Message.create({
            courseId,
            userId: session.user.id,
            role: 'assistant',
            content: greeting
        });

        return [{
            id: greetingMsg._id.toString(),
            role: 'assistant' as const,
            content: greeting,
            createdAt: greetingMsg.createdAt
        }];
    }

    return messages.map((m: any) => ({
        id: m._id.toString(),
        role: m.role,
        content: m.content,
        createdAt: m.createdAt
    }));
}

export async function getActivePlan(courseId: string) {
    const session = await auth();
    if (!session?.user?.id) return null;

    await dbConnect();

    const plan = await StudyPlan.findOne({
        courseId,
        userId: session.user.id,
        status: 'active'
    }).lean();

    if (!plan) return null;

    // Find the next pending task (not completed ones)
    const nextTask = plan.schedule?.find((t: any) => t.status === 'pending' || t.status === 'in-progress');
    const completedCount = plan.schedule?.filter((t: any) => t.status === 'completed').length || 0;

    // Get or create a session for the next task
    let sessionId = '';
    try {
        if (nextTask) {
            sessionId = await startSession(courseId, (plan._id as any).toString(), nextTask.topicName);
        }
    } catch (e) {
        // Session might already exist
    }

    return {
        phase: plan.phase,
        goal: plan.goal,
        nextTask: nextTask ? {
            topic: nextTask.topicName,
            date: new Date(nextTask.date).toLocaleDateString()
        } : { topic: 'All missions completed!', date: '' },
        startUrl: sessionId ? `/work/${sessionId}` : `/dashboard/courses/${courseId}`,
        completedCount,
        totalCount: plan.schedule?.length || 0
    };
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

    // 2. Fetch Context - ONLY ready resources
    const allResources = await Resource.find({ courseId, userId: session.user.id })
        .sort({ createdAt: -1 })
        .select('knowledgeBase title status errorMessage type learningMap suggestedOrder totalConcepts')
        .lean();

    // Separate by status
    const readyResources = allResources.filter((r: any) => r.status === 'ready');
    const processingResources = allResources.filter((r: any) => r.status === 'processing');
    const errorResources = allResources.filter((r: any) => r.status === 'error');

    // Build resource status context for the agent
    let resourceStatusContext = "\n\n[RESOURCE STATUS]\n";

    if (allResources.length === 0) {
        resourceStatusContext += `⚠️ NO MATERIALS UPLOADED YET!\nThe user hasn't uploaded any study materials for this course.\n`;
        resourceStatusContext += `IMPORTANT: Before you can create a meaningful study plan, you should:\n`;
        resourceStatusContext += `1. Ask them to upload their course materials (PDFs, slides, notes)\n`;
        resourceStatusContext += `2. Explain that you'll analyze the content to create a personalized plan\n`;
        resourceStatusContext += `3. You can still chat about their goals, but hold off on committing a plan until they have content\n`;
    } else {
        resourceStatusContext += `Ready to use: ${readyResources.length} files\n`;
        if (processingResources.length > 0) {
            resourceStatusContext += `⏳ Still analyzing: ${processingResources.length} files (${processingResources.map((r: any) => r.title).join(', ')})\n`;
            resourceStatusContext += `Note: These files are still being processed. Their content isn't available yet.\n`;
        }
        if (errorResources.length > 0) {
            resourceStatusContext += `❌ Failed to analyze: ${errorResources.length} files (${errorResources.map((r: any) => r.title).join(', ')})\n`;
            resourceStatusContext += `Note: These files couldn't be analyzed. The user might want to re-upload them.\n`;
        }
        if (readyResources.length === 0 && (processingResources.length > 0 || errorResources.length > 0)) {
            resourceStatusContext += `\n⚠️ NO USABLE MATERIALS YET: All uploaded files are either still processing or failed.\n`;
            resourceStatusContext += `Suggest the user wait for processing to complete or re-upload failed files.\n`;
        }
    }

    // Include learning map info for ready resources
    const totalConcepts = readyResources.reduce((sum: number, r: any) => sum + (r.totalConcepts || 0), 0);
    if (totalConcepts > 0) {
        resourceStatusContext += `\n📚 Total concepts identified: ${totalConcepts}\n`;

        // List some concepts to show what's available
        const conceptSample = readyResources
            .flatMap((r: any) => r.suggestedOrder?.slice(0, 5) || [])
            .slice(0, 10);
        if (conceptSample.length > 0) {
            resourceStatusContext += `Sample topics: ${conceptSample.join(', ')}\n`;
        }
    }

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

    // 2.6 Fetch CURRENT PLAN PROGRESS (So LLM knows which missions are done)
    const currentPlan = await StudyPlan.findOne({
        userId: session.user.id,
        courseId,
        status: 'active'
    }).select('goal phase schedule').lean();

    let planProgressContext = "";
    if (currentPlan) {
        const completed = currentPlan.schedule?.filter((t: any) => t.status === 'completed') || [];
        const pending = currentPlan.schedule?.filter((t: any) => t.status === 'pending' || t.status === 'in-progress') || [];

        planProgressContext = `\n\n[CURRENT PLAN PROGRESS]
Goal: ${currentPlan.goal}
Phase: ${currentPlan.phase}
Completed Missions (${completed.length}): ${completed.map((t: any) => t.topicName).join(', ') || 'None yet'}
Remaining Missions (${pending.length}): ${pending.map((t: any) => `${t.topicName} (${new Date(t.date).toLocaleDateString()})`).join(', ') || 'All done!'}

IMPORTANT: When adjusting the plan, do NOT modify or reschedule completed missions. Only adjust remaining/pending missions.`;
    }

    // Build document context ONLY from ready resources
    const docContext = readyResources.length > 0
        ? readyResources.map((r: any) => `[Document: ${r.title}]\n${r.knowledgeBase?.substring(0, 5000)}`).join("\n\n")
        : "[No analyzed materials available yet]";

    const contextText = `${resourceStatusContext}${docContext}${globalContext}${planProgressContext}`;

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
            status: 'pending',
            reasoning: t.reasoning
        }));

        // Check if user already has an active plan for this course
        const existingPlan = await StudyPlan.findOne({
            courseId,
            userId: session.user.id,
            status: 'active'
        });

        let newPlan;
        if (existingPlan) {
            // Preserve completed missions from existing plan
            const completedMissions = existingPlan.schedule?.filter((t: any) => t.status === 'completed') || [];

            // Merge: completed missions first, then new schedule
            const mergedSchedule = [
                ...completedMissions,
                ...schedule
            ];

            // Update existing plan with merged schedule
            existingPlan.goal = args.goal;
            existingPlan.phase = args.phase;
            existingPlan.schedule = mergedSchedule;
            await existingPlan.save();
            newPlan = existingPlan;
        } else {
            // Create new plan
            newPlan = await StudyPlan.create({
                courseId,
                userId: session.user.id,
                goal: args.goal,
                phase: args.phase,
                schedule: schedule,
                status: 'active'
            });
        }

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

            finalAiText = `**Plan Locked!**\n\nI have saved your strategy. You can start the mission below or continue chatting to adjust details.`;

        } catch (e) {
            console.error("Failed to auto-start session:", e);
            finalAiText = `**Plan Locked!**\n\nI created the plan, but couldn't auto-start the session. Please check your Dashboard.`;
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
