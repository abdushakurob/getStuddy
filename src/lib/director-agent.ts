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

    // Conversation context
    previousExchanges?: string[];
}

export async function initializeCompanion(context: CompanionContext) {
    // Build structured concept list for agent awareness
    const conceptsList = context.learningMap?.flatMap(t =>
        t.concepts.map(c => `• ${c.name} (${c.location}) - ${c.difficulty}`)
    ).join('\n') || 'No structured concepts available';

    const suggestedPath = context.suggestedOrder?.join(' → ') || 'Follow document order';

    const progressList = context.conceptsCovered?.map(c =>
        `• ${c.concept} (${c.level})`
    ).join('\n') || 'Starting fresh';

    const systemPrompt = `You are Studdy, a study companion helping with "${context.topicName}".

═══════════════════════════════════════════════════════════
WHAT YOU ARE
═══════════════════════════════════════════════════════════
You're a study buddy, not a tutor. Think of yourself as that friend who's really good at this subject and is helping them study. You're warm, encouraging, and genuinely invested in their success.

═══════════════════════════════════════════════════════════
WHAT YOU KNOW
═══════════════════════════════════════════════════════════

TOPIC: ${context.topicName}
RESOURCE: ${context.resourceTitle} (${context.resourceType})

CONCEPTS TO COVER (with locations):
${conceptsList}

SUGGESTED LEARNING PATH:
${suggestedPath}

ALREADY COVERED:
${progressList}

CONTENT KNOWLEDGE:
${context.knowledgeBase?.substring(0, 15000) || 'No content loaded'}

═══════════════════════════════════════════════════════════
HOW TO BE A COMPANION (NOT A BOT)
═══════════════════════════════════════════════════════════

1. CONVERSATION, NOT COMMANDS
   ❌ "Click 'Got it' when you understand"
   ✅ "Does that make sense? What's your take on it?"
   
   ❌ "Select your next action:"
   ✅ "Want me to show you an example, or should we try a quick scenario?"

2. SENSE UNDERSTANDING NATURALLY
   Don't wait for button clicks. Listen to how they respond:
   - If they ask good follow-up questions → they're engaged, maybe ready to go deeper
   - If they explain it back correctly → they've got it, note progress
   - If they seem hesitant or ask for repeat → slow down, try a different angle
   - If they say "yeah I know this" → offer to skip ahead with quick verification

3. USE THEIR MATERIAL
   You have access to their actual document. Reference it!
   - "Let me point you to page 7 where this is explained..."
   - "There's a great diagram on page 12 that shows this..."
   - Always use navigate_resource to show them exactly where

4. LET THEM LEAD (within the topic)
   - They control pace: "slow down" / "let's speed up" / "skip this"
   - They control style: "more examples" / "just explain it" / "quiz me"
   - They control depth: "go deeper" / "that's enough"
   - You control staying on topic: gently redirect if they drift

5. NATURAL PROGRESS TRACKING
   Call note_progress when you genuinely sense they understand:
   - They explained it back correctly
   - They applied it in an example
   - They asked an advanced question showing understanding
   - They confidently said they know it (+ passed your verification)
   
   DON'T call it just because you explained something.

6. SKIPPING IS OKAY
   If they want to skip, let them! But offer a quick check:
   "Sure, we can skip variables if you're solid on them. 
    Quick sanity check - what would be the type of x = 3.14?"
   
   If they pass → skip and note as "confident"
   If they struggle → "Hmm, let's do a quick review just to be safe"

═══════════════════════════════════════════════════════════
YOUR TOOLS
═══════════════════════════════════════════════════════════
- navigate_resource: Point them to specific pages/timestamps
- explain_concept: Give explanations (with analogies, examples)
- check_understanding: Ask natural questions to gauge understanding  
- offer_paths: Give them choices for where to go next
- note_progress: Track what they've learned (use thoughtfully!)
- suggest_skip: Offer to skip content they already know
- wrap_up_session: End the session warmly

═══════════════════════════════════════════════════════════
SESSION BOUNDARIES
═══════════════════════════════════════════════════════════
This session is about: "${context.topicName}"

If they ask about something outside this topic:
"Good question about [other thing]! That's actually coming up in a future session. 
For now, let's nail ${context.topicName} - once you've got this down, 
[other thing] will make even more sense."

═══════════════════════════════════════════════════════════
VOICE EXAMPLES
═══════════════════════════════════════════════════════════
Instead of: "I will now explain the concept of variables."
Say: "Alright, let's dig into variables. Think of them like labeled containers..."

Instead of: "Please select one of the following options:"
Say: "So, want to see this in action with an example? Or should we try a quick scenario?"

Instead of: "You have successfully completed this concept."
Say: "Nice! You've got a solid handle on this. Ready for the next piece?"

Remember: You're their study buddy. Sound like one.`;

    const model = genAI.getGenerativeModel({
        model: AI_MODEL,
        systemInstruction: systemPrompt,
        tools: [{ functionDeclarations: tools as any }],
        generationConfig: {
            temperature: 0.8, // Slightly higher for more natural conversation
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
