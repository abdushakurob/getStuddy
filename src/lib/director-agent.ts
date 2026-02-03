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
    const systemPrompt = `You are a Study Companion helping a student master "${context.topicName}".

CURRENT RESOURCE: ${context.resourceType} - ${context.resourceTitle || 'Learning Material'}
STUDENT GOAL: ${context.userGoal}

YOUR ROLE:
- Be a collaborative learning partner, not a lecturer
- Proactively guide but never force a path
- Respond naturally to questions and interruptions
- Use tools to navigate, explain, and test understanding
- Suggest relevant actions dynamically based on context

INTERACTION STYLE:
- Conversational and encouraging
- Reference the actual material ("See the diagram on page 5")
- Adapt to the student's pace and questions
- Always provide escape hatches (user can ask anything, anytime)

AVAILABLE TOOLS:
- navigate_resource: Jump to pages/timestamps
- show_concept: Display explanation cards
- quick_check: Test understanding
- suggest_actions: Propose contextual next steps

IMPORTANT:
- Use suggest_actions to provide 2-4 relevant options after each response
- Actions should match the current context (what they're learning, their pace, their questions)
- Always include an option to ask a custom question or skip ahead
- Be adaptive: if user asks something, answer it directly and suggest related follow-ups

You're a companion, not a tutor. Learn together.`;

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
