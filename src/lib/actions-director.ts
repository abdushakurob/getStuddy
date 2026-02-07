'use server';

import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import Session from '@/models/Session';
import { initializeCompanion, sendCompanionMessage } from './director-agent';
import { revalidatePath } from 'next/cache';

// Handle tool calls from Companion Agent
async function handleToolCall(toolCall: any, sessionId: string) {
    const { name, args } = toolCall;

    switch (name) {
        case 'navigate_resource':
            return {
                type: 'navigation',
                page: args.page,
                resourceId: args.resource_id, // Pass resource ID if present
                timestamp: args.timestamp, // Or use page for timestamp if unified
                context: args.context || args.concept
            };

        case 'explain_concept':
            return {
                type: 'explanation',
                concept: args.concept,
                explanation: args.explanation,
                analogy: args.analogy,
                example: args.example
            };

        case 'check_understanding':
            return {
                type: 'understanding_check',
                question: args.question,
                expectedInsight: args.expected_insight,
                hint: args.hint_if_stuck
            };

        case 'offer_paths':
            return {
                type: 'paths',
                paths: args.paths
            };

        case 'note_progress':
            return {
                type: 'progress_update',
                concept: args.concept,
                level: args.understanding_level,
                evidence: args.evidence
            };

        case 'suggest_skip':
            return {
                type: 'skip_suggestion',
                currentConcept: args.current_concept,
                skipTo: args.skip_to,
                verificationQuestion: args.quick_review_question
            };

        case 'wrap_up_session':
            return {
                type: 'session_complete',
                summary: args.summary,
                conceptsCovered: args.concepts_covered,
                nextTimePreview: args.next_time_preview
            };

        // --- Agentic Core Tools ---
        case 'update_milestone':
            return {
                type: 'milestone_update',
                milestoneLabel: args.label,
                newStatus: args.status
            };

        case 'add_milestone':
            return {
                type: 'milestone_add',
                label: args.label,
                reasoning: args.reasoning,
                position: args.position
            };

        case 'edit_milestone':
            return {
                type: 'milestone_edit',
                originalLabel: args.original_label,
                newLabel: args.new_label,
                newReasoning: args.new_reasoning
            };

        case 'park_topic':
            return {
                type: 'parking_update',
                action: 'add',
                topic: args.topic,
                question: args.question,
                context: args.context
            };

        case 'run_code':
            // Logic to run code (simulated)
            const { simulateCodeExecution } = await import('./director-agent');
            const output = await simulateCodeExecution(args.code);
            return {
                type: 'code_execution',
                code: args.code,
                output: output,
                status: 'completed'
            };

        case 'update_mood':
            return {
                type: 'mood_update',
                userEngagement: args.user_engagement,
                agentMode: args.agent_mode
            };

        default:
            console.warn(`Unknown tool called: ${name}`);
            return null;
    }
}

export async function sendMessageToDirector(sessionId: string, userMessage: string, messageRole: 'user' | 'system' = 'user', currentResourceId?: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    await dbConnect();

    // Fetch session
    const studySession = await Session.findById(sessionId);
    if (!studySession) throw new Error('Session not found');

    // Add message to transcript
    studySession.transcript.push({
        role: messageRole,
        content: userMessage,
        timestamp: new Date()
    });

    // Fetch resources with full learning data
    const Resource = (await import('@/models/Resource')).default;
    const resources = await Resource.find({
        courseId: studySession.courseId,
        status: 'ready'
    }).select('title type fileUrl knowledgeBase summary learningMap suggestedOrder totalConcepts').lean();

    // Find primary resource: Prioritize currentResourceId, then PDF, then first available
    let primaryResource;
    if (currentResourceId) {
        primaryResource = resources.find((r: any) => r._id.toString() === currentResourceId);
    }
    if (!primaryResource) {
        primaryResource = resources.find((r: any) => r.type === 'pdf') || resources[0];
    }

    // Merge learning maps from all resources
    const combinedLearningMap = resources.flatMap((r: any) => r.learningMap || []);
    const combinedSuggestedOrder = resources.flatMap((r: any) => r.suggestedOrder || []);
    const totalConcepts = resources.reduce((sum: number, r: any) => sum + (r.totalConcepts || 0), 0);

    // Build comprehensive content
    const knowledgeBase = resources.map((r: any) =>
        `=== ${r.title} (${r.type}) ===\n${r.knowledgeBase?.substring(0, 12000) || r.summary || ''}`
    ).join('\n\n');

    // List of resources for Agent to see
    const availableResourcesList = resources.map((r: any) =>
        `- ID: ${r._id.toString()} | Title: ${r.title} | Type: ${r.type}`
    ).join('\n');
    console.log("DEBUG: availableResourcesList sent to Agent:\n", availableResourcesList);

    // Build companion context with structured learning data AND Agentic State
    const context = {
        topicName: studySession.topicName,
        sessionGoal: studySession.title,
        resourceType: primaryResource?.type || 'document',
        resourceTitle: primaryResource?.title,
        resourceUrl: primaryResource?.fileUrl,

        // Structured learning data
        learningMap: combinedLearningMap,
        suggestedOrder: combinedSuggestedOrder,
        totalConcepts,

        // Content
        knowledgeBase,

        // Current progress
        conceptsCovered: studySession.progress?.conceptsCovered?.map((c: string) => ({
            concept: c,
            level: 'explained'
        })) || [],

        // --- Agentic State (Anchor & Drift) ---
        milestones: studySession.milestones || [],
        parkingLot: studySession.parkingLot || [],
        mood: studySession.mood || { userEngagement: 'neutral', agentMode: 'guide' },

        // Recent conversation for context
        previousExchanges: studySession.transcript.slice(-6).map((t: any) =>
            `${t.role}: ${t.content?.substring(0, 200)}`
        ),

        // Multi-Resource Awareness
        availableResourcesList
    };

    const model = await initializeCompanion(context);

    // Build chat history for Gemini
    const rawHistory = studySession.transcript.slice(0, -1).map((t: any) => {
        let textContent = t.content || '';

        // Inject tool calls into history so Agent knows what it did
        if (t.toolCalls && t.toolCalls.length > 0) {
            const toolSummary = t.toolCalls.map((tc: any) => `[Action: ${tc.tool}]`).join(' ');
            textContent = textContent ? `${textContent}\n${toolSummary}` : toolSummary;
        }

        // Ensure non-empty text for API
        if (!textContent || textContent.trim() === '') {
            textContent = '[User Action]'; // Fallback
        }

        return {
            role: t.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: textContent }]
        };
    });

    // Gemini requires first message to be from 'user'
    const firstUserIndex = rawHistory.findIndex((m: any) => m.role === 'user');
    const history = firstUserIndex >= 0 ? rawHistory.slice(firstUserIndex) : [];

    // Send message to Companion
    const response = await sendCompanionMessage(model, userMessage, history);

    // Process tool calls
    // Map returns promises now because handleToolCall is async
    const toolResults = await Promise.all(
        response.toolCalls.map((tc: any) => handleToolCall(tc, sessionId))
    ).then(results => results.filter(Boolean));

    // Extract paths (new suggested actions format)
    const suggestedActions = toolResults
        .filter((r: any) => r?.type === 'paths')
        .flatMap((r: any) => r.paths?.map((p: any) => ({
            label: p.suggestion,
            intent: p.suggestion,
            reason: p.reason,
            priority: p.type === 'continue' ? 'primary' : 'secondary'
        })) || []);

    // Extract navigation commands
    const navigationCommands = toolResults.filter((r: any) => r?.type === 'navigation');

    // Update progress based on tool calls
    let progressUpdated = false;
    let milestonesUpdated = false;

    for (const result of toolResults) {
        if (result?.type === 'progress_update') {
            const existingIndex = studySession.progress.conceptsCovered.indexOf(result.concept);
            if (existingIndex === -1) {
                studySession.progress.conceptsCovered.push(result.concept);
                progressUpdated = true;
            }
        } else if (result?.type === 'session_complete') {
            studySession.progress.isComplete = true;
            studySession.status = 'completed';
            // ... (existing logic) ...
            progressUpdated = true;

        } else if (result?.type === 'milestone_update') {
            // Update milestone status in DB
            if (studySession.milestones) {
                const ms = studySession.milestones.find((m: any) => m.label === result.milestoneLabel);
                if (ms) {
                    ms.status = result.newStatus;
                    milestonesUpdated = true;
                }
            }

        } else if (result?.type === 'milestone_add') {
            const newMilestone = {
                label: result.label,
                reasoning: result.reasoning,
                status: 'pending'
            };

            if (result.position === 'next') {
                // Find current active index
                const activeIdx = studySession.milestones.findIndex((m: any) => m.status === 'active');
                const insertIdx = activeIdx !== -1 ? activeIdx + 1 : 0;
                studySession.milestones.splice(insertIdx, 0, newMilestone);
            } else {
                studySession.milestones.push(newMilestone);
            }
            milestonesUpdated = true;

        } else if (result?.type === 'milestone_edit') {
            const ms = studySession.milestones.find((m: any) => m.label === result.originalLabel);
            if (ms) {
                if (result.newLabel) ms.label = result.newLabel;
                if (result.newReasoning) ms.reasoning = result.newReasoning;
                milestonesUpdated = true;
            }

        } else if (result?.type === 'parking_update') {
            if (result.action === 'add') {
                studySession.parkingLot.push({
                    topic: result.topic,
                    question: result.question,
                    context: result.context,
                    addedAt: new Date()
                });
            }
            // Handle clear/remove if added later

        } else if (result?.type === 'mood_update') {
            if (!studySession.mood) studySession.mood = {};
            if (result.userEngagement) studySession.mood.userEngagement = result.userEngagement;
            if (result.agentMode) studySession.mood.agentMode = result.agentMode;
        }
    }

    // Add assistant response to transcript
    studySession.transcript.push({
        role: 'assistant',
        content: response.text || '',
        timestamp: new Date(),
        toolCalls: response.toolCalls.map((tc: any) => ({
            tool: tc.name,
            args: tc.args
        })),
        suggestedActions: suggestedActions.length > 0 ? suggestedActions : undefined
    });

    await studySession.save();
    revalidatePath(`/work/${sessionId}`);

    // Return extended results including plan updates
    return {
        message: response.text,
        toolResults,
        suggestedActions,
        navigationCommands,
        transcriptId: studySession.transcript[studySession.transcript.length - 1]._id?.toString(),
        progress: progressUpdated ? {
            conceptsCovered: studySession.progress.conceptsCovered,
            estimatedTotal: context.totalConcepts || studySession.progress.estimatedTotal,
            isComplete: studySession.progress.isComplete
        } : undefined,
        // We could return updated milestones here for client, 
        // but client should re-fetch session or use server actions to refresh logic
        planAdjustment: milestonesUpdated ? { type: 'milestone_change' } : null
    };
}

export async function handleActionIntent(sessionId: string, intent: string) {
    // For the new companion approach, we pass the natural language suggestion directly
    // No need to map - the companion understands natural language
    return sendMessageToDirector(sessionId, intent);
}

export async function getSessionTranscript(sessionId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    await dbConnect();
    const studySession = await Session.findById(sessionId);

    if (!studySession) throw new Error('Session not found');

    return {
        transcript: studySession.transcript,
        topicName: studySession.topicName,
        progress: studySession.progress
    };
}
