'use server';

import { auth } from '@/auth';
import dbConnect from './db';
import StudyPlan from '@/models/StudyPlan';
import Session from '@/models/Session';
import Course from '@/models/Course'; // Ensure Schema is registered
import { startSession } from './actions-session';
import { redirect } from 'next/navigation';

export async function getDashboardData() {
    try {
        const session = await auth();
        if (!session?.user?.id) return null;

        await dbConnect();

        // 1. Fetch Last Active Session (for "Jump Back In")
        const lastSession = await Session.findOne({
            userId: session.user.id,
            status: { $ne: 'abandoned' } // any active or completed session
        })
            .sort({ updatedAt: -1 })
            .populate('courseId', 'title color')
            .lean();

        // 2. Fetch Active Courses (from StudyPlans or just Courses?)
        // Let's fetch StudyPlans as they track progress.
        const activePlans = await StudyPlan.find({
            userId: session.user.id,
            status: 'active'
        })
            .sort({ updatedAt: -1 })
            .populate('courseId', 'title color')
            .lean();

        return {
            user: {
                name: session.user.name
            },
            lastSession: lastSession ? {
                id: lastSession._id.toString(),
                courseTitle: (lastSession.courseId as any)?.title || "Unknown Course",
                courseColor: (lastSession.courseId as any)?.color || "#000000",
                topicName: lastSession.topicName,
                date: lastSession.updatedAt || lastSession.startTime,
                isComplete: lastSession.status === 'completed'
            } : null,
            activeCourses: activePlans.map(plan => ({
                planId: plan._id.toString(),
                courseId: (plan.courseId as any)?._id.toString(),
                title: (plan.courseId as any)?.title || "Untitled Course",
                color: (plan.courseId as any)?.color || "#4C8233",
                progress: plan.progress || 0,
                phase: plan.phase || "Foundation"
            }))
        };
    } catch (error) {
        console.error("getDashboardData Error:", error);
        return null;
    }
}

// ACTION: Start the Mission (Redirects to Workspace)
export async function continueMission() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    await dbConnect();

    // Get Active Plan
    const plan = await StudyPlan.findOne({
        userId: session.user.id,
        status: 'active'
    }).sort({ updatedAt: -1 });

    if (!plan) redirect('/dashboard/courses');

    // Find Task
    const schedule = plan.schedule || [];
    const activeTask = schedule.find((t: any) => t.status === 'pending') || schedule[0];

    // Start Session
    const sessionId = await startSession(
        plan.courseId.toString(),
        plan._id.toString(),
        activeTask.topicName
    );

    redirect(`/work/${sessionId}`);
}
