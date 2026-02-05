'use server';

import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import Session from '@/models/Session';
import { initializeCompanion, sendCompanionMessage } from './director-agent';
import { revalidatePath } from 'next/cache';

// Handle tool calls from Companion Agent
function handleToolCall(toolCall: any, sessionId: string) {
    const { name, args } = toolCall;

    switch (name) {
        case 'navigate_resource':
            return {
                type: 'navigation',
                page: args.page,
                timestamp: args.timestamp,
                context: args.context
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

        default:
            return null;
    }
}

export async function sendMessageToDirector(sessionId: string, userMessage: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    await dbConnect();

    // Fetch session
    const studySession = await Session.findById(sessionId);
    if (!studySession) throw new Error('Session not found');

    // Add user message to transcript
    studySession.transcript.push({
        role: 'user',
        content: userMessage,
        timestamp: new Date()
    });

    // Fetch resources with full learning data
    const Resource = (await import('@/models/Resource')).default;
    const resources = await Resource.find({
        courseId: studySession.courseId,
        status: 'ready'
    }).select('title type fileUrl knowledgeBase summary learningMap suggestedOrder totalConcepts').lean();

    // Find primary resource
    const primaryResource = resources.find((r: any) => r.type === 'pdf') || resources[0];

    // Merge learning maps from all resources
    const combinedLearningMap = resources.flatMap((r: any) => r.learningMap || []);
    const combinedSuggestedOrder = resources.flatMap((r: any) => r.suggestedOrder || []);
    const totalConcepts = resources.reduce((sum: number, r: any) => sum + (r.totalConcepts || 0), 0);

    // Build comprehensive content
    const knowledgeBase = resources.map((r: any) =>
        `=== ${r.title} (${r.type}) ===\n${r.knowledgeBase?.substring(0, 12000) || r.summary || ''}`
    ).join('\n\n');

    // Build companion context with structured learning data
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

        // Recent conversation for context
        previousExchanges: studySession.transcript.slice(-6).map((t: any) =>
            `${t.role}: ${t.content?.substring(0, 200)}`
        )
    };

    const model = await initializeCompanion(context);

    // Build chat history for Gemini
    const rawHistory = studySession.transcript.slice(0, -1).map((t: any) => ({
        role: t.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: t.content }]
    }));

    // Gemini requires first message to be from 'user'
    const firstUserIndex = rawHistory.findIndex((m: any) => m.role === 'user');
    const history = firstUserIndex >= 0 ? rawHistory.slice(firstUserIndex) : [];

    // Send message to Companion
    const response = await sendCompanionMessage(model, userMessage, history);

    // Process tool calls
    const toolResults = response.toolCalls.map((tc: any) => handleToolCall(tc, sessionId)).filter(Boolean);

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
    for (const result of toolResults) {
        if (result?.type === 'progress_update') {
            // Add concept with level tracking
            const existingIndex = studySession.progress.conceptsCovered.indexOf(result.concept);
            if (existingIndex === -1) {
                studySession.progress.conceptsCovered.push(result.concept);
                progressUpdated = true;
            }
            // Could track levels in a separate field if needed
        } else if (result?.type === 'session_complete') {
            studySession.progress.isComplete = true;
            studySession.status = 'completed';
            for (const concept of result.conceptsCovered || []) {
                if (!studySession.progress.conceptsCovered.includes(concept)) {
                    studySession.progress.conceptsCovered.push(concept);
                }
            }
            progressUpdated = true;
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
        } : undefined
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
