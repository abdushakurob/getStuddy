import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { AI_MODEL } from "./ai-config";

// --- Configuration ---
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY!);

const tools = [
    {
        name: "navigate_resource",
        description: "Navigates the user's view to a specific page or location in a resource. Use this to grounding explanations.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                page: { type: SchemaType.NUMBER, description: "Page number (For PDF documents only)" },
                timestamp: { type: SchemaType.STRING, description: "Timestamp (e.g. '1:30' or '90') for Video/Audio only." },
                concept: { type: SchemaType.STRING, description: "The concept being shown (optional context)" },
                context: { type: SchemaType.STRING, description: "The concept being shown (optional context)" },
                resource_id: { type: SchemaType.STRING, description: "ID of the resource to switch to. See AVAILABLE RESOURCES list." }
            },
            required: ["context"]
        }
    },
    // ... other tools can be added here if shared
];

export function initializeCompanion(context: any) {
    // Generate Roadmap Text
    const milestonesText = (context.milestones && context.milestones.length > 0)
        ? context.milestones.map((m: any) => `- [${m.status === 'completed' ? 'x' : ' '}] ${m.label} ${m.status === 'active' ? '(CURRENT)' : ''}`).join('\n')
        : "No roadmap yet. Plan the session.";

    const currentMilestone = context.milestones?.find((m: any) => m.status === 'active')
        || context.milestones?.find((m: any) => m.status === 'pending');

    const parkingLotText = (context.parkingLot && context.parkingLot.length > 0)
        ? context.parkingLot.map((p: any) => `- ${p.topic}: ${p.question}`).join('\n')
        : "Empty";

    const systemPrompt = `
    You are the **Academic Companion**, a helpful, encouraging, and highly intelligent study guide.
    Your goal is to help the learner master the material in the current syllabus or topic.

    ═══════════════════════════════════════════════════════════
    SESSION STATE (THE "ANCHOR")
    ═══════════════════════════════════════════════════════════
    Main Topic: ${context.topicName}
    Active Resource: ${context.resourceTitle} (${context.resourceType})
    
    AVAILABLE RESOURCES (Use resource_id to switch):
    ${context.availableResourcesList || "Only current resource available."}
    (IMPORTANT: You must use the EXACT 24-character ID string provided above. Do not use generic names or short numbers like '1' or '39')

    NAVIGATION RULES:
    - To jump to a specific timestamp in a video/audio, use 'navigate_resource' with 'timestamp' (e.g. "1:30") and the EXACT 'resource_id'.
    - To jump to a specific page in a PDF, use 'navigate_resource' with 'page' (e.g. 10) and the EXACT 'resource_id'.
    - ALWAYS use 'navigate_resource' when you mention a specific location.


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
    ${context.knowledgeBase?.substring(0, 500000) || 'No content loaded'}

    ═══════════════════════════════════════════════════════════
    YOUR CORE BEHAVIOR LOOPS
    ═══════════════════════════════════════════════════════════
    1. THE ANCHOR LOOP (Staying on Track)
       - Always know which Milestone is active.
       - If the user asks a question RELEVANT to the milestone -> Answer deep.
       - If the material is in ANOTHER resource -> SWITCH TO IT! Use 'navigate_resource(page, resource_id)'.
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
    - navigate_resource: REQUIRED. Whenever you discuss a specific page/video, YOU MUST CALL THIS TOOL. It auto-scrolls the user's screen. Do not just say "Page 5" — take them there! It also ensures your timestamps are clickable links to the correct video.
    - explain_concept: For deep dives.
    - check_understanding: For those "Flashcard" moments.
    - offer_paths: Use at the very start or if stuck.
    - park_topic: Use when the user goes down a rabbit hole.
    - update_milestone: CRITICAL. Call this to tick off boxes.
    - update_mood: Optional. Use when you change your strategy.

    ═══════════════════════════════════════════════════════════
    VOICE & STYLE
    ═══════════════════════════════════════════════════════════
    - **ROLE**: You are a STUDY COMPANION, not a teacher or a search engine. We are learning TOGETHER.
    - **YOUR SUPERPOWER**: You have read/watched ALL the course material. Your job is to synthesize it for the user to save them time, but NOT replace the material.
    - **ALWAYS REFERENCE**: Every explanation must point back to a source.
      * GOOD: "As the lecture mentions (Video 0:33), variables are buckets. This aligns with the diagram in the PDF (Page 5)..."
      * BAD: "Variables are buckets." (Too generic).
    - **SYNTHESIZE**: If multiple resources cover a topic, connect them. "The video shows the code, but the PDF (Page 12) explains the theory better. Let's look at the PDF..."
    - **TEACH FIRST, SHOW SECOND**: Don't say "The material says X". Explain X yourself, then use the resource as proof.
      * BAD: "The video at 0:33 explains that variables are containers."
      * GOOD: "Think of a variable as a labeled box where you store data. In the video at 0:33, you'll see the instructor create a box named 'score', and the PDF (Page 2) defines the syntax..."
    - **IMMEDIATE VALUE**: Don't say "Let's start". START. Don't say "I will explain". EXPLAIN.
    - **TONE**: Collaborative, encouraging, "We". "Let's figure this out," "Look what I found in the transcript..."
    - **navigation**: Use \`navigate_resource\` to physically bringing the user to the reference point. Don't just talk about it, SHOW IT.
    - **NO SILENT TOOLS**: You must ALWAYS provide a message explaining your action. Never call a tool without text.
    - **CODE EXECUTION**: Use \`run_code\` to demonstrate Python concepts. The user can see the output!

    ALREADY COVERED:
    ${context.conceptsCovered?.map((c: any) => `• ${c.concept} (${c.level})`).join('\n') || 'Starting fresh'}
    `;

    // Add new tools to the toolset
    const agentTools = [
        ...tools.filter(t => t.name !== 'navigate_resource'), // Remove old to replace
        {
            name: "run_code",
            description: "Executes Python code and returns the output to the user. Use this to demonstrate concepts live.",
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    code: { type: SchemaType.STRING, description: "The Python code to execute" }
                },
                required: ["code"]
            }
        },
        {
            name: "navigate_resource",
            description: "Navigates the user's view to a specific page or location in a resource. Use this to grounding explanations.",
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    page: { type: SchemaType.NUMBER, description: "Page number (For PDF documents only)" },
                    timestamp: { type: SchemaType.STRING, description: "Timestamp (e.g. '1:30' or '90') for Video/Audio only." },
                    concept: { type: SchemaType.STRING, description: "The concept being shown (optional context)" },
                    context: { type: SchemaType.STRING, description: "The concept being shown (optional context)" }, // Alias for concept to match other tools
                    resource_id: { type: SchemaType.STRING, description: "ID of the resource to switch to. See AVAILABLE RESOURCES list." }
                },
                // require one of page or timestamp? schema doesn't support ONE-OF easily.
                // make none required, or handle in prompting.
                required: ["context"]
            }
        },
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
            temperature: 0.4,
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
    try {
        const chat = model.startChat({ history });
        const result = await chat.sendMessage(message);
        const response = result.response;

        // Check for safety blocking
        if (response.promptFeedback?.blockReason) {
            console.warn("Blocked:", response.promptFeedback.blockReason);
            return {
                text: "I'm sorry, I can't generate that response safely.",
                toolCalls: [],
                raw: response
            };
        }

        let text = "";
        try {
            text = response.text();
        } catch (e) {
            console.error("Error getting text (likely blocked):", e);
            text = "I couldn't generate a text response.";
        }

        // Extract tool calls
        let functionCalls = [];
        try {
            functionCalls = response.functionCalls();
        } catch (e) {
            // functionCalls() might throw if no function call exists or if malformed
            // but usually it just returns undefined if none.
            // If malformed, we ignore tools.
            console.log("No tool calls or error parsing them:", e);
        }

        return {
            text: text,
            toolCalls: functionCalls || [],
            raw: response
        };
    } catch (error: any) {
        console.error("Gemini API Error:", error);
        throw new Error(`AI Service Error: ${error.message}`);
    }
}

// Simulate code execution using LLM
export async function simulateCodeExecution(code: string) {
    try {
        const model = genAI.getGenerativeModel({ model: AI_MODEL });
        const prompt = `
You are a Python Interpreter.
Act as if you executed the following Python code.
Return ONLY the output that would be printed to the console.
If there are no print statements, return the result of the last expression.
If there is an error, return the error message.
DO NOT wrap the output in markdown code blocks. Just the raw text.

CODE:
${code}
`;
        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (error) {
        console.error("Simulation error:", error);
        return "Error executing code.";
    }
}

// Legacy exports for backward compatibility
export const initializeDirector = initializeCompanion;
export const sendDirectorMessage = sendCompanionMessage;
