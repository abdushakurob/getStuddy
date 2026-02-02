
'use server';

import { auth } from '@/auth';
import dbConnect from './db';
import StudyPlan, { IStudyPlan } from '@/models/StudyPlan';

export async function getDashboardData() {
    const session = await auth();
    if (!session?.user?.id) return null;

    await dbConnect();

    // 1. Fetch Active Plan (The latest one)
    // We populate the course details to get the color/title
    const plan = await StudyPlan.findOne({
        userId: session.user.id,
        status: 'active'
    })
        .sort({ createdAt: -1 })
        .populate('courseId', 'title color')
        .lean();

    if (!plan) {
        return {
            hasPlan: false,
            mission: null,
            stats: { streak: 0, xp: 0, progress: 0 }
        };
    }

    // 2. Find Today's Mission
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const schedule = plan.schedule || [];

    // Find task for today
    const todaysTask = schedule.find((t: any) => {
        const tDate = new Date(t.date);
        tDate.setHours(0, 0, 0, 0);
        return tDate.getTime() === today.getTime();
    });

    // If no task today, find the NEXT task
    const nextTask = !todaysTask ? schedule.find((t: any) => {
        const tDate = new Date(t.date);
        tDate.setHours(0, 0, 0, 0);
        return tDate.getTime() > today.getTime();
    }) : null;

    const activeMission = todaysTask || nextTask;

    return {
        hasPlan: true,
        planId: plan._id.toString(),
        course: plan.courseId, // { title, color }
        mission: activeMission ? {
            ...activeMission,
            isToday: !!todaysTask, // Boolean flag
            dateString: activeMission.date.toISOString()
        } : null,
        stats: {
            streak: 0, // TODO: Implement Streak Logic
            xp: 0,     // TODO: Implement XP Logic
            progress: plan.progress || 0
        }
    };
}
