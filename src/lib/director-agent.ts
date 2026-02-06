import { SchemaType } from "@google/generative-ai";
import { genAI, AI_MODEL } from './ai-config';

// Companion Tools - Designed for natural conversation, not robotic interactions
const tools = [
    {
        name: "navigate_resource",
        description: "Point the student to a specific location in their material. Use this to reference what they're studying - 'Let me show you this on page 5'",
        parameters: {
            type: "object",
            properties: {
                page: {
                    type: "number",
                    description: "Page number for PDFs (1-indexed)"
                },
                timestamp: {
                    type: "string",
                    description: "Timestamp for videos/audio (e.g., '2:30' or '1:45:30')"
                },
                context: {
                    type: "string",
                    description: "What you want them to look at (e.g., 'the diagram showing variable scope')"
                }
            },
            required: ["context"]
        }
    },
    {
        name: "explain_concept",
        description: "Give a focused explanation of a concept. Use conversational language as if talking to a friend.",
        parameters: {
            type: "object",
            properties: {
                concept: { type: "string", description: "What concept you're explaining" },
                explanation: { type: "string", description: "Clear, friendly explanation" },
                analogy: { type: "string", description: "Optional real-world analogy to make it click" },
                example: { type: "string", description: "Optional practical example" }
            },
            required: ["concept", "explanation"]
        }
    },
    {
        name: "check_understanding",
        description: "Naturally check if the student understands. NOT a formal quiz - more like 'Quick question - what do you think would happen if...?'",
        parameters: {
            type: "object",
            properties: {
                question: { type: "string", description: "A natural, conversational question" },
                expected_insight: { type: "string", description: "What understanding you're checking for" },
                hint_if_stuck: { type: "string", description: "Gentle hint to offer if they struggle" }
            },
            required: ["question", "expected_insight"]
        }
    },
    {
        name: "offer_paths",
        description: "Offer the student choices for where to go next. Make these feel like natural suggestions, not robot buttons.",
        parameters: {
            type: "object",
            properties: {
                paths: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            suggestion: { type: "string", description: "Natural language suggestion (e.g., 'Dive deeper into this')" },
                            reason: { type: "string", description: "Why this might be good for them" },
                            type: { type: "string", enum: ["continue", "explore", "skip", "review", "practice"] }
                        }
                    },
                    description: "2-4 natural paths forward"
                }
            },
            required: ["paths"]
        }
    },
    {
        name: "note_progress",
        description: "Internally track that a concept has been covered. Call this when you sense understanding through conversation - not just when they click a button.",
        parameters: {
            type: "object",
            properties: {
                concept: { type: "string", description: "What concept was covered" },
                understanding_level: {
                    type: "string",
                    enum: ["introduced", "explained", "practiced", "confident"],
                    description: "How well they seem to understand"
                },
                evidence: { type: "string", description: "What made you think they understand (e.g., 'correctly explained back', 'asked insightful follow-up')" }
            },
            required: ["concept", "understanding_level"]
        }
    },
    {
        name: "suggest_skip",
        description: "When you sense the student already knows this, offer to skip ahead with an optional quick review",
        parameters: {
            type: "object",
            properties: {
                current_concept: { type: "string" },
                skip_to: { type: "string", description: "What concept to skip to" },
                quick_review_question: { type: "string", description: "A quick question to confirm they know it before skipping" }
            },
            required: ["current_concept", "skip_to"]
        }
    },
    {
        name: "wrap_up_session",
        description: "End the session naturally. Summarize what was learned and set up for next time.",
        parameters: {
            type: "object",
            properties: {
                summary: { type: "string", description: "Warm recap of what was accomplished" },
                concepts_covered: { type: "array", items: { type: "string" } },
                next_time_preview: { type: "string", description: "Brief tease of what's coming next" }
            },
            required: ["summary", "concepts_covered"]
        }
    }
];

// Extended context with structured learning data
interface CompanionContext {
    // Session info
    topicName: string;
    sessionGoal?: string;

    // Resource info
    resourceTitle?: string;
    resourceType: string;
    resourceUrl?: string;

    // Structured learning data from document analysis
    learningMap?: Array<{
        topic: string;
        concepts: Array<{
            name: string;
            location: string;
            prerequisites: string[];
            difficulty: string;
            keyPoints: string[];
        }>;
    }>;
    suggestedOrder?: string[];
    totalConcepts?: number;

    // Content
    knowledgeBase?: string;

    // Progress
    conceptsCovered?: Array<{
        concept: string;
        level: string;
    }>;

    // Agentic State
    milestones?: Array<{ label: string; status: string; reasoning: string }>;
    parkingLot?: Array<{ topic: string; question: string }>;
    mood?: { userEngagement: string; agentMode: string };
}

export async function initializeCompanion(context: CompanionContext) {
    // Format Milestones for Prompt
    const milestonesText = context.milestones?.map((m) =>
        `- [${m.status === 'completed' ? 'x' : ' '}] ${m.label} (${m.status})`
    ).join('\n') || "No formal milestones.";

    const currentMilestone = context.milestones?.find((m) => m.status === 'active')
        || context.milestones?.find((m) => m.status === 'pending');

    const parkingLotText = (context.parkingLot && context.parkingLot.length > 0)
        ? context.parkingLot.map((p) => `- ${p.topic}: ${p.question}`).join('\n')
        : "Empty";

    const systemPrompt = `
    You are Studdy, an Agentic Study Companion.
    Your goal is not just to answer, but to DRIVE the session towards learning goals.

    ═══════════════════════════════════════════════════════════
    SESSION STATE (THE "ANCHOR")
    ═══════════════════════════════════════════════════════════
    Main Topic: ${context.topicName}
    Resource: ${context.resourceTitle} (${context.resourceType})
    
    ROADMAP (Your GPS):
    ${milestonesText}

    CURRENT TARGET: ${currentMilestone?.label || "General Understanding of " + context.topicName}

    PARKING LOT (Deferred Ideas):
    ${parkingLotText}

    CURRENT MODE: ${context.mood?.agentMode || 'guide'}
    (guide = explanatory, challenger = questioning/testing, supporter = encouraging)

    ═══════════════════════════════════════════════════════════
    KNOWLEDGE BASE (Search this first!)
    ═══════════════════════════════════════════════════════════
    ${context.knowledgeBase?.substring(0, 20000) || 'No content loaded'}

    ═══════════════════════════════════════════════════════════
    YOUR CORE BEHAVIOR LOOPS
    ═══════════════════════════════════════════════════════════
    1. THE ANCHOR LOOP (Staying on Track)
       - Always know which Milestone is active.
       - If the user asks a question RELEVANT to the milestone -> Answer deep.
       - If the user DRIFTS (asks off-topic) -> CHECK DRIFT:
         * Small drift? Answer briefly (1-2 sentences) then bridge back.
         * Big drift? Use 'park_topic' tool! Say: "Great point! Let's park that for later so we finish [Current Target] first."

    2. THE PROGRESS LOOP (Moving Forward)
       - When a Milestone feels understood -> Use 'update_milestone(label, "completed")'.
       - Then immediately pivot to the next one: "Nice work. Completed [Label]. Ready for [Next Label]?"
       - Don't wait for the user to lead. YOU lead.

    3. THE ENGAGEMENT LOOP (Flashcards over Quizzes)
       - Don't say "Time for a quiz".
       - Do say "Quick check - what happens if...?" or "Flip this in your head..."
       - If they are passive (short answers), switch to CHALLENGER mode (ask more preds).
       - If they are struggling, switch to SUPPORTER mode (more analogies).
       - Use 'update_mood' if you sense a shift.

    ═══════════════════════════════════════════════════════════
    TOOL USAGE RULES
    ═══════════════════════════════════════════════════════════
    - navigate_resource: REQUIRED. Whenever you discuss a specific page, YOU MUST CALL THIS TOOL. It auto-scrolls the user's screen. Do not just say "Page 5" — take them there!
    - explain_concept: For deep dives.
    - check_understanding: For those "Flashcard" moments.
    - offer_paths: Use at the very start or if stuck.
    - park_topic: Use when the user goes down a rabbit hole.
    - update_milestone: CRITICAL. Call this to tick off boxes.
    - update_mood: Optional. Use when you change your strategy.

    ═══════════════════════════════════════════════════════════
    VOICE & STYLE
    ═══════════════════════════════════════════════════════════
    - Be concise but warm.
    - Use "We" ("Let's tackle this").
    - Use Markdown for bolding key terms.
    - AVOID "Is there anything else?". You are the leader. Suggest the next step.

    ALREADY COVERED:
    ${context.conceptsCovered?.map(c => `• ${c.concept} (${c.level})`).join('\n') || 'Starting fresh'}
    `;

    // Add new tools to the toolset
    const agentTools = [
        ...tools,
        // --- Agentic Tools ---
        {
            name: "update_milestone",
            description: "Updates the status of a learning milestone. Call this when a sub-topic is completed or started.",
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    label: { type: SchemaType.STRING, description: "The exact label of the existing milestone" },
                    status: { type: SchemaType.STRING, enum: ["active", "completed"], description: "The new status" }
                },
                required: ["label", "status"]
            }
        },
        {
            name: "add_milestone",
            description: "Adds a new milestone to the roadmap. Use this when the user wants to cover a new sub-topic.",
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    label: { type: SchemaType.STRING, description: "Short title" },
                    reasoning: { type: SchemaType.STRING, description: "Why we are adding this" },
                    position: { type: SchemaType.STRING, enum: ["next", "end"], description: "Where to insert it" }
                },
                required: ["label", "reasoning", "position"]
            }
        },
        {
            name: "edit_milestone",
            description: "Edits an existing milestone. Use this to clarify or rename a goal.",
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    original_label: { type: SchemaType.STRING, description: "The current label" },
                    new_label: { type: SchemaType.STRING, description: "The new label" },
                    new_reasoning: { type: SchemaType.STRING, description: "Updated reasoning" }
                },
                required: ["original_label", "new_label"]
            }
        },
        {
            name: "park_topic",
            description: "Saves an off-topic question/idea to the Parking Lot for later discussion.",
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    topic: { type: SchemaType.STRING, description: "Short topic title" },
                    question: { type: SchemaType.STRING, description: "The user's question or idea" },
                    context: { type: SchemaType.STRING, description: "Where this came up (e.g. 'Page 5')" }
                },
                required: ["topic", "question"]
            }
        },
        {
            name: "update_mood",
            description: "Updates your strategy based on user engagement.",
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    user_engagement: { type: SchemaType.STRING, enum: ["high", "low", "neutral"] },
                    agent_mode: { type: SchemaType.STRING, enum: ["guide", "challenger", "supporter"] }
                },
                required: ["user_engagement", "agent_mode"]
            }
        }
    ];

    const model = genAI.getGenerativeModel({
        model: AI_MODEL,
        systemInstruction: systemPrompt,
        tools: [{ functionDeclarations: agentTools as any }],
        generationConfig: {
            temperature: 0.85,
            maxOutputTokens: 2048,
        }
    });

    return model;
}

export async function sendCompanionMessage(
    model: any,
    message: string,
    history: any[]
) {
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(message);
    const response = result.response;

    // Extract tool calls
    const functionCalls = response.functionCalls();

    return {
        text: response.text(),
        toolCalls: functionCalls || [],
        raw: response
    };
}

// Legacy exports for backward compatibility
export const initializeDirector = initializeCompanion;
export const sendDirectorMessage = sendCompanionMessage;
