'use server';

import { auth } from '@/auth';
import dbConnect from './db';
import StudyPlan from '@/models/StudyPlan';

export async function getSidebarData() {
    const session = await auth();
    if (!session?.user?.id) return { activeMissions: [] };

    await dbConnect();

    // Fetch active plans to show in "Your Missions"
    const activePlans = await StudyPlan.find({
        userId: session.user.id,
        status: 'active'
    })
        .sort({ updatedAt: -1 })
        .limit(3)
        .populate('courseId', 'title') // We need the course title
        .lean();

    // Map to a UI-friendly structure
    const activeMissions = activePlans.map((plan: any) => {
        // Find the next pending task
        const nextTask = plan.schedule.find((t: any) => t.status === 'pending');

        // If no pending task, maybe the plan is done? Just use the first one or generic
        const missionName = nextTask ? nextTask.topicName : plan.goal;

        return {
            id: plan._id.toString(),
            courseId: plan.courseId?._id.toString(),
            courseTitle: plan.courseId?.title || "Untitled Course",
            phase: plan.phase,
            nextTask: missionName
        };
    });

    return { activeMissions };
}
