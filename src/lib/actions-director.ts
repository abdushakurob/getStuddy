'use server';

import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import Session from '@/models/Session';
import { initializeCompanion, sendCompanionMessage } from './director-agent';
import { revalidatePath } from 'next/cache';
import { findNodeByPage, resolveResourceNode } from '@/lib/citekit-resolver';

// Helper to fetch evidence from UploadThing and convert to Base64 (Essential for Gemini Multimodal)
async function fetchAsBase64(url: string): Promise<string> {
    try {
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (StuddyBot/1.0)' }
        });
        if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
        const buffer = await response.arrayBuffer();
        return Buffer.from(buffer).toString('base64');
    } catch (e) {
        console.error("[fetchAsBase64] Error:", e);
        throw e;
    }
}

async function handleToolCall(toolCall: any, sessionId: string) {
    const { name, args } = toolCall;

    switch (name) {
        case 'navigate_resource':
            // PURE UI NAVIGATION - No evidence fetching
            return {
                type: 'navigation',
                page: args.page,
                timestamp: args.timestamp,
                resourceId: args.resource_id,
                context: "Navigating UI..."
            };

        case 'ground_concept':
            console.log(`[CiteKit Grounding] Pinning concept: ${args.node_id}`);
            let pinnedUrl = null;
            try {
                // 1. Resolve Node
                // Note: We might need to look up node ID by page if not provided, but ground_concept requires node_id.
                const targetNodeId = args.node_id;

                if (targetNodeId && args.resource_id) {
                    pinnedUrl = await resolveResourceNode(args.resource_id, targetNodeId);
                }

                // 2. Persist to Session (Sticky)
                if (pinnedUrl) {
                    await Session.findByIdAndUpdate(sessionId, {
                        $set: {
                            activeGroundingUrl: pinnedUrl,
                            activeGroundingNodeId: targetNodeId
                        }
                    });
                }
            } catch (e) {
                console.error("[ground_concept] Failed:", e);
            }

            return {
                type: 'grounding',
                nodeId: args.node_id,
                resolvedUrl: pinnedUrl,
                context: args.context
            };

        case 'clear_grounding':
            await Session.findByIdAndUpdate(sessionId, {
                $unset: {
                    activeGroundingUrl: 1,
                    activeGroundingNodeId: 1
                }
            });
            return {
                type: 'grounding_cleared'
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
    }).select('title type fileUrl knowledgeBase summary learningMap citeKitMap suggestedOrder totalConcepts').lean();

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
        `=== ${r.title} (${r.type}) ===\n${r.knowledgeBase?.substring(0, 50000) || r.summary || ''}`
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
        citeKitMap: primaryResource?.citeKitMap,
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
    let lastResolvedUrl: string | null = null;

    const history = studySession.transcript.slice(0, -1).map((t: any) => {
        let textContent = t.content || '';

        // Inject tool calls info into text to preserve continuity
        if (t.toolCalls && t.toolCalls.length > 0) {
            const toolSummary = t.toolCalls.map((tc: any) => `[Action: ${tc.tool}]`).join(' ');
            textContent = textContent ? `${textContent}\n${toolSummary}` : toolSummary;
        }

        const parts: any[] = [{ text: textContent || '[Action]' }];

        // Check for resolved evidence URL from previous tools in this turn
        if (t.toolResults) {
            const navResult = t.toolResults.find((r: any) => r.type === 'navigation' && r.resolvedUrl);
            if (navResult) {
                lastResolvedUrl = navResult.resolvedUrl;
            }
        }

        // If we have a resolved URL, attach it to the turns moving forward (or at least the turn it was generated in)
        // Gemini allows multiple parts in a message.
        if (lastResolvedUrl && t.role === 'assistant') {
            parts.push({
                fileData: {
                    fileUri: lastResolvedUrl,
                    mimeType: "application/pdf"
                }
            });
            // We can clear it after attaching so it doesn't clutter every turn,
            // OR keep it for persistent context. Let's keep it for now.
        }

        // Sticky Grounding Injection
        // If the session has an activeGroundingUrl, we attach it to EVERY assistant turn
        // to remind the model of what it is looking at.
        // Optimization: We could attach it only to the system prompt or first turn,
        // but attaching to recent turns ensures fresh vision.
        if (studySession.activeGroundingUrl && t.role === 'assistant') {
            // We don't have studySession inside map... wait, we do via closure? Yes.
            // Ideally we pass it in. But let's check current turn logic.
        }

        return {
            role: t.role === 'assistant' ? 'model' : 'user',
            parts
        };
    });

    // Inject Sticky Grounding into History
    // We'll just start afresh for the current turn below.
    // Actually, for history, let's inject it if the TURN itself established the grounding.
    // But simplifcation: The Model "sees" what is in the current context.

    // Gemini requires first message to be from 'user'
    const firstUserIndex = history.findIndex((m: any) => m.role === 'user');
    const finalHistory = firstUserIndex >= 0 ? history.slice(firstUserIndex) : [];

    // Also inject the most recent evidence into the CURRENT message parts
    const currentMessageParts: any[] = [{ text: userMessage }];

    // FETCH STICKY EVIDENCE
    if (studySession.activeGroundingUrl) {
        try {
            console.log(`[CiteKit Sticky] Attaching evidence: ${studySession.activeGroundingNodeId}`);
            const base64Data = await fetchAsBase64(studySession.activeGroundingUrl);
            currentMessageParts.push({
                inlineData: {
                    data: base64Data,
                    mimeType: "application/pdf"
                }
            });
        } catch (e) {
            console.error("[CiteKit Sticky] Failed to attach evidence:", e);
        }
    }

    const response = await sendCompanionMessage(model, currentMessageParts as any, finalHistory);

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

    // Clean up response text (remove any hallucinations of [Action: ...])
    const cleanContent = (response.text || '')
        .replace(/\[Action:.*?\]/g, '')
        .trim();

    // Add assistant response to transcript
    studySession.transcript.push({
        role: 'assistant',
        content: cleanContent,
        timestamp: new Date(),
        toolCalls: response.toolCalls.map((tc: any) => ({
            tool: tc.name,
            args: tc.args
        })),
        toolResults: toolResults.length > 0 ? toolResults : undefined, // SAVE TO DB
        suggestedActions: suggestedActions.length > 0 ? suggestedActions : undefined
    });

    await studySession.save();
    revalidatePath(`/work/${sessionId}`);

    // Return extended results including plan updates
    return {
        message: cleanContent,
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
