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

        // 2. Fetch ALL Courses (not just those with plans)
        const courses = await Course.find({ userId: session.user.id })
            .sort({ updatedAt: -1 })
            .lean();

        // 3. Fetch Active Plans to overlay progress
        const activePlans = await StudyPlan.find({
            userId: session.user.id,
            status: 'active'
        }).lean();

        // Map plans by courseId for easy lookup
        const planMap = new Map(activePlans.map(p => [p.courseId.toString(), p]));

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
            activeCourses: courses.map(course => {
                const plan: any = planMap.get(course._id.toString());
                return {
                    planId: plan?._id.toString() || "no-plan", // logic in UI might need this or just ignore
                    courseId: course._id.toString(),
                    title: course.title,
                    color: course.color || "#4C8233",
                    progress: plan?.progress || 0,
                    phase: plan?.phase || "New"
                };
            })
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
