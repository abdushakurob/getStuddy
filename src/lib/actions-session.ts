'use server';

import { auth } from '@/auth';
import dbConnect from './db';
import Session from '@/models/Session';
import StudyPlan from '@/models/StudyPlan';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { waitUntil } from '@vercel/functions';

// Start a new logical session for a specific topic in a Plan
export async function startSession(courseId: string, studyPlanId: string, topicName: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    await dbConnect();

    // 0. Check for existing active session for this specific topic
    // This prevents creating duplicate sessions when the user leaves and returns
    const existingSession = await Session.findOne({
        userId: session.user.id,
        studyPlanId,
        topicName,
        status: 'active'
    }).select('_id');

    if (existingSession) {
        return existingSession._id.toString();
    }

    // 1. SMART RESOURCE SELECTION
    // Fetch all resources to find the best match for this topic
    const Resource = (await import('@/models/Resource')).default;
    const { identifyBestResource } = await import('./resource-matcher');
    const { generateSessionMilestones } = await import('./planning-agent'); // Import Planner

    const availableResources = await Resource.find({
        courseId,
        status: 'ready'
    }).select('_id title type summary documentType knowledgeBase').lean();

    const selectedResourceId = await identifyBestResource(topicName, availableResources as any[]);

    // Find the actual resource object to get context for planning
    const selectedResource = availableResources.find(r => r._id.toString() === selectedResourceId);
    const contextSummary = selectedResource?.summary || selectedResource?.knowledgeBase || "";

    // 1b. GENERATE ROADMAP (AGENTIC)
    const milestones = await generateSessionMilestones(topicName, contextSummary);

    // 2. Create the session
    const newSession = await Session.create({
        userId: session.user.id,
        courseId,
        studyPlanId,
        title: `Focus: ${topicName}`,
        topicName,
        status: 'active',
        currentResourceId: selectedResourceId,
        milestones: milestones.map(m => ({
            label: m.label,
            reasoning: m.reasoning,
            status: 'pending'
        })),
        // Mark first as active if exists
        ...(milestones.length > 0 && {
            'milestones.0.status': 'active' // Actually just set it in map closer
        }),
        transcript: []
    });

    // Fix status for first milestone manually since mixed types in create can be tricky
    if (newSession.milestones && newSession.milestones.length > 0) {
        newSession.milestones[0].status = 'active';
        await newSession.save();
    }

    // 3. Trigger the agent to generate the initial greeting with actions
    const { sendMessageToDirector } = await import('./actions-director');

    waitUntil((async () => {
        try {
            // Generate greeting in background to avoid blocking session start
            await sendMessageToDirector(
                newSession._id.toString(),
                `[New session] Briefly welcome the student as a supportive companion, then IMMEDIATELY pivot to the first milestone: "${milestones[0]?.label || topicName}". Ask if they are ready to dive in or if they want to adjust the plan first.`,
                'system'
            );
        } catch (error) {
            // ... fallback ...
            console.error('Failed to generate initial greeting:', error);
            newSession.transcript.push({
                role: 'assistant',
                content: `Hey! Ready to learn about **${topicName}**? Let's start with **${milestones[0]?.label || 'the basics'}**!`,
                timestamp: new Date()
            });
            await newSession.save();
        }
    })());

    // 4. Return ID (Client will redirect)
    return newSession._id.toString();
}

import Resource from '@/models/Resource';

// ... imports

export async function getSession(sessionId: string) {
    const session = await auth();
    if (!session?.user?.id) return null;

    await dbConnect();

    const sess = await Session.findById(sessionId).lean();
    if (!sess) return null;

    if (sess.userId.toString() !== session.user.id) return null;

    // FETCH RELEVANT RESOURCE
    // Prioritize the one explicitly linked to this session
    let resource;

    if (sess.currentResourceId) {
        resource = await Resource.findById(sess.currentResourceId)
            .select('title type fileUrl')
            .lean();
    }

    // Fallback if no specific resource link or link is broken
    if (!resource) {
        resource = await Resource.findOne({ courseId: sess.courseId })
            .sort({ createdAt: -1 })
            .select('title type fileUrl')
            .lean();
    }

    // Fetch all available resources for the course
    const allAvailableResources = await Resource.find({ courseId: sess.courseId })
        .select('_id title type fileUrl')
        .lean();

    return {
        ...sess,
        _id: sess._id.toString(),
        userId: sess.userId.toString(),
        courseId: sess.courseId.toString(),
        studyPlanId: sess.studyPlanId.toString(),
        transcript: sess.transcript.map((t: any) => ({
            ...t,
            _id: t._id ? t._id.toString() : undefined,
            timestamp: t.timestamp.toISOString(),
            // Serialize suggestedActions (remove MongoDB _id)
            suggestedActions: t.suggestedActions?.map((a: any) => ({
                label: a.label,
                intent: a.intent,
                priority: a.priority
            }))
        })),
        // Serialize resourceId
        currentResourceId: sess.currentResourceId?.toString(),

        // Serialize new Agentic fields
        milestones: sess.milestones?.map((m: any) => ({
            _id: m._id?.toString(), // Mongoose adds _id to subdocs
            label: m.label,
            status: m.status,
            reasoning: m.reasoning
        })) || [],

        parkingLot: sess.parkingLot?.map((p: any) => ({
            _id: p._id?.toString(),
            topic: p.topic,
            question: p.question,
            addedAt: p.addedAt.toISOString()
        })) || [],

        mood: sess.mood || { userEngagement: 'neutral', agentMode: 'guide' },

        // Serialize progress
        progress: {
            conceptsCovered: sess.progress?.conceptsCovered || [],
            estimatedTotal: sess.progress?.estimatedTotal || 5,
            isComplete: sess.progress?.isComplete || false
        },
        activeResource: resource ? {
            _id: resource._id.toString(),
            title: resource.title,
            type: resource.type,
            fileUrl: resource.fileUrl
        } : null,

        // Return list of ALL available resources for switching
        availableResources: allAvailableResources?.map((r: any) => ({
            id: r._id.toString(),
            _id: r._id.toString(), // Ensure _id is also present for some logic
            title: r.title,
            type: r.type,
            url: r.fileUrl, // Map fileUrl to url
            fileUrl: r.fileUrl // Keep fileUrl just in case
        })) || [],

        highlights: sess.highlights?.map((h: any) => ({
            _id: h._id?.toString(),
            text: h.text,
            pageIndex: h.pageIndex,
            rects: h.rects,
            color: h.color,
            note: h.note
        })) || []
    };
}

export async function saveHighlight(sessionId: string, highlight: any) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    await dbConnect();

    await Session.findByIdAndUpdate(
        sessionId,
        { $push: { highlights: highlight } }
    );

    revalidatePath(`/work/${sessionId}`);
}

export async function deleteHighlight(sessionId: string, highlightId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    await dbConnect();

    await Session.findByIdAndUpdate(
        sessionId,
        { $pull: { highlights: { _id: highlightId } } }
    );

    revalidatePath(`/work/${sessionId}`);
}
