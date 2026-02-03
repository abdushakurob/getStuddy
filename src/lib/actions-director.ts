'use server';

import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import Session from '@/models/Session';
import { initializeDirector, sendDirectorMessage } from './director-agent';
import { revalidatePath } from 'next/cache';

// Handle tool calls from Director Agent
function handleToolCall(toolCall: any, sessionId: string) {
    const { name, args } = toolCall;

    switch (name) {
        case 'navigate_resource':
            return {
                type: 'navigation',
                location: args.location,
                reason: args.reason
            };

        case 'show_concept':
            return {
                type: 'concept',
                title: args.title,
                body: args.body,
                example: args.example
            };

        case 'quick_check':
            return {
                type: 'check',
                question: args.question,
                options: args.options,
                correctIndex: args.correctIndex,
                explanation: args.explanation
            };

        case 'suggest_actions':
            return {
                type: 'actions',
                actions: args.actions
            };

        case 'suggest_plan_adjustment':
            return {
                type: 'plan_adjustment',
                reason: args.reason,
                adjustmentType: args.adjustmentType,
                details: args.details,
                urgency: args.urgency || 'medium'
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

    // Initialize Director Agent
    const context = {
        topicName: studySession.topicName,
        resourceType: 'PDF', // TODO: Get from currentResource
        userGoal: 'Master the topic',
        previousInteractions: studySession.transcript.slice(-5).map((t: any) => t.content)
    };

    const model = await initializeDirector(context);

    // Build chat history for Gemini
    const history = studySession.transcript.slice(0, -1).map((t: any) => ({
        role: t.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: t.content }]
    }));

    // Send message to Director
    const response = await sendDirectorMessage(model, userMessage, history);

    // Process tool calls
    const toolResults = response.toolCalls.map((tc: any) => handleToolCall(tc, sessionId));

    // Extract suggested actions from tool calls
    const suggestedActions = toolResults
        .filter((r: any) => r?.type === 'actions')
        .flatMap((r: any) => r.actions);

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
        transcriptId: studySession.transcript[studySession.transcript.length - 1]._id
    };
}

export async function handleActionIntent(sessionId: string, intent: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    // Map intent to user message
    const intentMessages: Record<string, string> = {
        'show_syntax': 'Show me the syntax',
        'compare_tuples': 'How is this different from tuples?',
        'show_example': 'Can you show me an example?',
        'continue': 'I understand, let\'s continue',
        'next_concept': 'Move to the next concept',
        'break_down': 'Break this down more',
        'skip_ahead': 'Skip to advanced topics'
    };

    const message = intentMessages[intent] || intent;
    return sendMessageToDirector(sessionId, message);
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
