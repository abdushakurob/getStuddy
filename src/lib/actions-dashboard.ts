'use server';

import { auth } from '@/auth';
import dbConnect from './db';
import StudyPlan from '@/models/StudyPlan';
import { startSession } from './actions-session';
import { redirect } from 'next/navigation';

export async function getDashboardData() {
    const session = await auth();
    if (!session?.user?.id) return null;

    await dbConnect();

    // 1. Fetch Active Plan (The latest ONE)
    // We populate the course details to get the color/title
    const plan = await StudyPlan.findOne({
        userId: session.user.id,
        status: 'active'
    })
        .sort({ updatedAt: -1 })
        .populate('courseId', 'title color')
        .lean();

    if (!plan) {
        return {
            hasPlan: false,
            mission: null,
            stats: { streak: 0, xp: 0, progress: 0 }
        };
    }

    // 2. Find The Next Mission (First Pending Task)
    // We ignore dates for ordering, just grab the first uncompleted one.
    // If all done, grab the last one? Or just the first one.
    const schedule = plan.schedule || [];
    const activeTask = schedule.find((t: any) => t.status === 'pending') || schedule[0];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(activeTask.date);
    taskDate.setHours(0, 0, 0, 0);
    const isToday = taskDate.getTime() === today.getTime();

    return {
        hasPlan: true,
        planId: plan._id.toString(),
        course: {
            title: plan.courseId?.title || "Course",
            color: plan.courseId?.color || "#4C8233"
        },
        mission: activeTask ? {
            topicName: activeTask.topicName,
            activityType: activeTask.activityType,
            reasoning: activeTask.reasoning,
            dateString: activeTask.date.toISOString(),
            isToday
        } : null,
        stats: {
            streak: 0,
            xp: 0,
            progress: plan.progress || 0
        }
    };
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
