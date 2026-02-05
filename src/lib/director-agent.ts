import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Director Agent Tools
const tools = [
    {
        name: "navigate_resource",
        description: "Navigate to a specific location in the learning material (page number for PDFs, timestamp for videos)",
        parameters: {
            type: "object",
            properties: {
                location: {
                    type: "string",
                    description: "Page number (e.g., 'page 5') or timestamp (e.g., '2:30')"
                },
                reason: {
                    type: "string",
                    description: "Brief explanation of why you're navigating here"
                }
            },
            required: ["location", "reason"]
        }
    },
    {
        name: "show_concept",
        description: "Display a concept explanation card to help the user understand",
        parameters: {
            type: "object",
            properties: {
                title: { type: "string", description: "Concept title" },
                body: { type: "string", description: "Clear explanation" },
                example: { type: "string", description: "Optional code or practical example" }
            },
            required: ["title", "body"]
        }
    },
    {
        name: "quick_check",
        description: "Test understanding with a quick question",
        parameters: {
            type: "object",
            properties: {
                question: { type: "string" },
                options: {
                    type: "array",
                    items: { type: "string" },
                    description: "Answer options"
                },
                correctIndex: {
                    type: "number",
                    description: "Index of correct answer (0-based)"
                },
                explanation: {
                    type: "string",
                    description: "Why this is the correct answer"
                }
            },
            required: ["question", "options", "correctIndex"]
        }
    },
    {
        name: "suggest_actions",
        description: "Propose contextual actions for the user based on current situation",
        parameters: {
            type: "object",
            properties: {
                actions: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            label: { type: "string", description: "Button text" },
                            intent: { type: "string", description: "What this action does" },
                            priority: {
                                type: "string",
                                enum: ["primary", "secondary"],
                                description: "Visual priority"
                            }
                        }
                    }
                }
            },
            required: ["actions"]
        }
    },
    {
        name: "suggest_plan_adjustment",
        description: "Suggest changes to the study plan based on session performance or user needs",
        parameters: {
            type: "object",
            properties: {
                reason: {
                    type: "string",
                    description: "Why this adjustment is needed (e.g., 'User struggling with concept', 'User ahead of schedule')"
                },
                adjustmentType: {
                    type: "string",
                    enum: ["add_review", "skip_ahead", "extend_topic", "reschedule"],
                    description: "Type of adjustment to make"
                },
                details: {
                    type: "string",
                    description: "Specific details about the adjustment"
                },
                urgency: {
                    type: "string",
                    enum: ["low", "medium", "high"],
                    description: "How critical this adjustment is"
                }
            },
            required: ["reason", "adjustmentType", "details"]
        }
    },
    {
        name: "mark_concept_covered",
        description: "Mark that you've covered a concept with the user. Call this when you've explained something and the user seems to understand, or after a successful quiz/check.",
        parameters: {
            type: "object",
            properties: {
                conceptName: {
                    type: "string",
                    description: "Short name of the concept covered (e.g., 'list indexing', 'for loops')"
                },
                confidence: {
                    type: "string",
                    enum: ["low", "medium", "high"],
                    description: "How confident you are that the user understood"
                }
            },
            required: ["conceptName"]
        }
    },
    {
        name: "complete_session",
        description: "Mark the session as complete when you've covered the main concepts for this topic",
        parameters: {
            type: "object",
            properties: {
                summary: {
                    type: "string",
                    description: "Brief summary of what was covered in this session"
                },
                conceptsCovered: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of concepts that were covered"
                }
            },
            required: ["summary", "conceptsCovered"]
        }
    }
];

interface DirectorContext {
    topicName: string;
    resourceType: string;
    resourceTitle?: string;
    userGoal: string;
    previousInteractions: string[];
    currentLocation?: string;
}

export async function initializeDirector(context: DirectorContext) {
    const systemPrompt = `You are Studdy, a study companion helping a student with "${context.topicName}".

CURRENT RESOURCE: ${context.resourceType} - ${context.resourceTitle || 'Learning Material'}
STUDENT GOAL: ${context.userGoal}

WHO YOU ARE:
- A warm, supportive study companion - like a knowledgeable friend studying alongside them
- You learn together, celebrate wins together, and work through challenges together
- You're not a tutor, teacher, or AI assistant - you're their companion

YOUR APPROACH:
- Be conversational and natural, like a friend helping them study
- Adapt to their pace - if they're curious, explore; if they're struggling, simplify
- Switch naturally between explaining, asking questions, using flashcards
- Reference the actual material ("Check out the example on page 5")
- Keep things moving, but never rush them

TRACKING PROGRESS:
- Use mark_concept_covered when you've explained something and they get it
- Use quick_check occasionally to make sure they're following
- When you've covered the main ideas for this topic, use complete_session

AVAILABLE TOOLS:
- navigate_resource: Jump to specific pages or timestamps
- show_concept: Show an explanation card for a concept
- quick_check: Ask a quick question to check understanding
- mark_concept_covered: Track that you've covered a concept
- suggest_actions: Offer 2-3 next steps (keep them moving)
- complete_session: Wrap up when the topic is covered

VOICE:
- Friendly, warm, encouraging
- "Let's check out..." not "You should read..."
- "Nice! That's right" not "Correct answer"
- "We've covered a lot!" not "Session progress updated"

Remember: You're Studdy, their companion. Study together.`;

    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: systemPrompt,
        tools: [{ functionDeclarations: tools as any }],
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
        }
    });

    return model;
}

export async function sendDirectorMessage(
    model: any,
    message: string,
    history: any[]
) {
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(message);
    const response = result.response;

    // Check for tool calls
    const functionCalls = response.functionCalls();

    return {
        text: response.text(),
        toolCalls: functionCalls || [],
        raw: response
    };
}
