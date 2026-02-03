'use server';

import { auth } from '@/auth';
import dbConnect from './db';
import Session from '@/models/Session';
import StudyPlan from '@/models/StudyPlan';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Start a new logical session for a specific topic in a Plan
export async function startSession(courseId: string, studyPlanId: string, topicName: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    await dbConnect();

    // 1. Create the session
    const newSession = await Session.create({
        userId: session.user.id,
        courseId,
        studyPlanId,
        title: `Focus: ${topicName}`,
        topicName,
        status: 'active',
        transcript: [
            {
                role: 'system',
                content: `Session started for topic: ${topicName}. Welcome to the Director Mode.`,
                timestamp: new Date()
            }
        ]
    });

    // 2. Return ID (Client will redirect)
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
    // Heuristic: Find a resource whose title matches the topic, or just the most recent one.
    // In a real app, the `StudyPlan` tasks would link to specific `ResourceIds`.
    // For now, we grab the most recent resource in the course as a fallback.
    const resource = await Resource.findOne({ courseId: sess.courseId })
        .sort({ createdAt: -1 })
        .select('title type fileUrl')
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
            timestamp: t.timestamp.toISOString()
        })),
        // Attach Resource
        activeResource: resource ? {
            _id: resource._id.toString(),
            title: resource.title,
            type: resource.type,
            fileUrl: resource.fileUrl
        } : null
    };
}
