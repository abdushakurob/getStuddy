'use server';

import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import StudyPlan from '@/models/StudyPlan';
import Session from '@/models/Session';
import { revalidatePath } from 'next/cache';

interface PlanAdjustment {
    reason: string;
    adjustmentType: 'add_review' | 'skip_ahead' | 'extend_topic' | 'reschedule';
    details: string;
    urgency?: 'low' | 'medium' | 'high';
}

export async function suggestPlanAdjustment(
    sessionId: string,
    adjustment: PlanAdjustment
) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    await dbConnect();

    // Get the study session
    const studySession = await Session.findById(sessionId);
    if (!studySession) throw new Error('Session not found');

    // Get the study plan
    const plan = await StudyPlan.findById(studySession.studyPlanId);
    if (!plan) throw new Error('Study plan not found');

    // Return suggestion for user approval
    return {
        suggestion: {
            type: adjustment.adjustmentType,
            reason: adjustment.reason,
            details: adjustment.details,
            urgency: adjustment.urgency || 'medium',
            currentPlan: {
                goal: plan.goal,
                phase: plan.phase,
                totalTasks: plan.schedule.length
            }
        },
        requiresApproval: true
    };
}

export async function applyPlanAdjustment(
    sessionId: string,
    adjustmentType: 'add_review' | 'skip_ahead' | 'extend_topic' | 'reschedule',
    details: any
) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    await dbConnect();

    // Get the study session
    const studySession = await Session.findById(sessionId);
    if (!studySession) throw new Error('Session not found');

    // Get the study plan
    const plan = await StudyPlan.findById(studySession.studyPlanId);
    if (!plan) throw new Error('Study plan not found');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (adjustmentType) {
        case 'add_review':
            // Add a review session for the current topic
            const currentTopic = studySession.topicName;
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            plan.schedule.push({
                date: tomorrow,
                topicName: `${currentTopic} (Review)`,
                status: 'pending',
                reasoning: details
            });

            // Sort schedule by date
            plan.schedule.sort((a, b) => a.date.getTime() - b.date.getTime());
            break;

        case 'skip_ahead':
            // Mark current topic as mastered and move to next
            const currentIndex = plan.schedule.findIndex(
                (task: any) => task.topicName === studySession.topicName && task.status === 'pending'
            );

            if (currentIndex !== -1) {
                plan.schedule[currentIndex].status = 'completed';

                // Update session progress
                if (!studySession.progress.conceptsCovered.includes(studySession.topicName)) {
                    studySession.progress.conceptsCovered.push(studySession.topicName);
                }
            }
            break;

        case 'extend_topic':
            // Add more time/sessions for current topic
            const extendDate = new Date(today);
            extendDate.setDate(extendDate.getDate() + 2);

            plan.schedule.push({
                date: extendDate,
                topicName: `${studySession.topicName} (Deep Dive)`,
                status: 'pending',
                reasoning: details
            });

            plan.schedule.sort((a, b) => a.date.getTime() - b.date.getTime());
            break;

        case 'reschedule':
            // Adjust dates based on new timeline
            // This is more complex and would require parsing details
            // For now, just log it
            console.log('Reschedule requested:', details);
            break;
    }

    await plan.save();
    await studySession.save();

    revalidatePath(`/work/${sessionId}`);
    revalidatePath(`/dashboard/courses/${studySession.courseId}`);

    return {
        success: true,
        updatedPlan: {
            goal: plan.goal,
            phase: plan.phase,
            totalTasks: plan.schedule.length,
            adjustmentApplied: adjustmentType
        }
    };
}
