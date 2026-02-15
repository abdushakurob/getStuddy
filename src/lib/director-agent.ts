import { SchemaType } from "@google/generative-ai";
import { AI_MODEL, genAI } from "./ai-config";

// --- Configuration ---

const tools = [
    {
        name: "navigate_resource",
        description: "Navigates the user's view to a specific page or location. PURELY UI SCROLLING. Does NOT fetch new evidence for you to see. Use 'ground_concept' if you need to SEE the content.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                page: { type: SchemaType.NUMBER, description: "Page number to scroll to." },
                timestamp: { type: SchemaType.STRING, description: "Timestamp for Video/Audio." },
                resource_id: { type: SchemaType.STRING, description: "ID of the resource to switch to." }
            },
            required: ["page"]
        }
    },
    {
        name: "ground_concept",
        description: "Fetches and PINS physical evidence (PDF slices, video frames) for a specific concept/node. Once called, you will SEE this evidence in every future turn until you clear it. Call this when starting a new sub-topic.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                node_id: { type: SchemaType.STRING, description: "The exact CiteKit Node ID from the Map. REQUIRED." },
                resource_id: { type: SchemaType.STRING, description: "ID of the resource." },
                context: { type: SchemaType.STRING, description: "Reason for grounding (e.g. 'Analyzing Example 1.3')" }
            },
            required: ["node_id", "context"]
        }
    },
    {
        name: "clear_grounding",
        description: "Clears the currently pinned visual evidence. Call this when moving to a completely new topic where the old evidence is distracting.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {},
        }
    }
];

export function initializeCompanion(context: any) {
    // Generate Roadmap Text
    const milestonesText = (context.milestones && context.milestones.length > 0)
        ? context.milestones.map((m: any) => `- [${m.status === 'completed' ? 'x' : ' '}] ${m.label} ${m.status === 'active' ? '(CURRENT)' : ''}`).join('\n')
        : "No roadmap yet. Plan the session.";

    // Build MASTER PAGE INDEX from CiteKit Map (Primary) or Learning Map (Fallback)
    let pageIndexText = "";
    if (context.citeKitMap && context.citeKitMap.nodes) {
        pageIndexText = context.citeKitMap.nodes.map((node: any) => {
            const pages = node.location?.pages?.join(', ') || 'N/A';
            const nodeName = node.label || node.title || `[${node.type || 'Content'}]`;
            const snippet = node.content ? `\n    Content: "${node.content.substring(0, 300)}..."` : "";
            return `[PDF Page ${pages}] ${nodeName}${snippet}`;
        }).join('\n\n');
    } else if (context.learningMap && context.learningMap.length > 0) {
        pageIndexText = context.learningMap.map((unit: any) =>
            `${unit.topic}:\n${(unit.concepts || []).map((c: any) =>
                `  - ${c.name} → ${c.location || 'Unknown page'}`
            ).join('\n')}`
        ).join('\n');
    } else {
        pageIndexText = "No page index available. Be cautious with page references.";
    }

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

    NAVIGATION RULES (THE CITEKIT FLOW):
    - You are grounded by the **CiteKit Map**.
    - To focus on a concept, use 'navigate_resource' with the **node_id** from the MASTER PAGE INDEX below.
    - Using 'node_id' is PREFERRED over 'page' as it points to the exact semantic segment identified during ingestion.
    - To jump to a specific timestamp in a video/audio, use 'navigate_resource' with 'timestamp' (e.g. "1:30") and the EXACT 'resource_id'.
    - ALWAYS use 'navigate_resource' when you mention a specific location or concept.


    ROADMAP (Your GPS):
    ${milestonesText}

    CURRENT TARGET: ${currentMilestone?.label || "General Understanding of " + context.topicName}

    PARKING LOT (Deferred Ideas):
    ${parkingLotText}

    CURRENT MODE: ${context.mood?.agentMode || 'guide'}
    (guide = explanatory, challenger = questioning/testing, supporter = encouraging)

    ═══════════════════════════════════════════════════════════
    MASTER PAGE INDEX (CiteKit Nodes - Your source of truth!)
    ═══════════════════════════════════════════════════════════
    ${pageIndexText}

    IMPORTANT: When using navigate_resource, ALWAYS prioritize using the **node_id** from the index above.
    The Node IDs are semantic links to the actual content. Navigating by Node ID ensures the system resolves the EXACT segment you are looking at.
    Do NOT guess or infer page numbers from the knowledge base text. The PAGE INDEX is the source of truth.

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
    - navigate_resource: REQUIRED. Whenever you discuss a specific page/video, YOU MUST CALL THIS TOOL. It auto-scrolls the user's screen. CRITICAL: You MUST include a text message with every navigation. Example: "Let's look at the diagram on Page 5 that shows..." followed by the navigate_resource call. NEVER navigate without explaining what you're showing and why. Use page numbers from the PAGE INDEX below — do NOT guess.
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
    - **NO SILENT TOOLS (CRITICAL RULE)**: You MUST ALWAYS provide a text message alongside ANY tool call. A tool call without text is a CRITICAL ERROR. Always explain what you're doing and why BEFORE or WITH the tool call. Example: "Let me take you to Page 14 where the Endowment Effect is defined..." + navigate_resource call.
    - **CODE EXECUTION**: Use \`run_code\` ONLY if the user asks for a code demo or if the source material is explicitly about Programming/Computer Science. DO NOT write Python scripts for Math/Chemistry unless asked.
    
    ═══════════════════════════════════════════════════════════
    GROUNDED MULTIMODAL CONTEXT (The CiteKit Flow)
    ═══════════════════════════════════════════════════════════
    1. **Sticky Grounding**: Use 'ground_concept(node_id)' to PIN a document slice to your view.
    2. **Persistence**: Once pinned, that image stays with you for every turn. You don't need to re-fetch it.
    3. **Navigation**: Use 'navigate_resource' to scroll the user, but remember it doesn't change what YOU see. Only 'ground_concept' updates your vision.
    4. Speak with the authority of direct observation when evidence is attached.
    `;

    // Add new tools to the toolset
    // Add new tools to the toolset
    const agentTools = [
        ...tools, // Includes navigate_resource, ground_concept, clear_grounding
        {
            name: "run_code",
            description: "Executes Python code. use ONLY IF the user explicitly asks for code or the subject is Computer Science. Do not use for general visualization.",
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    code: { type: SchemaType.STRING, description: "The Python code to execute" }
                },
                required: ["code"]
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
    message: string | any[],
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

        // Extract text from response parts
        let text = "";
        const candidateParts = response.candidates?.[0]?.content?.parts || [];
        for (const part of candidateParts) {
            if (part.text) text += part.text;
        }

        // Extract tool calls
        let functionCalls: any[] = [];
        try {
            functionCalls = response.functionCalls() || [];
        } catch (e) {
            console.log("No tool calls or error parsing them:", e);
        }

        // Multi-turn function calling: if the model returned function calls
        // but no text, send the function results back to get a text response.
        // This is the standard Gemini function calling flow.
        if (!text.trim() && functionCalls.length > 0) {
            console.log("[Companion] Model returned function calls without text, sending results back for follow-up...");

            // Build function response parts to send back
            const functionResponseParts = functionCalls.map((fc: any) => ({
                functionResponse: {
                    name: fc.name,
                    response: { success: true, result: `Tool ${fc.name} executed successfully.` }
                }
            }));

            try {
                // Send function results back — model will generate its text response
                const followUpResult = await chat.sendMessage(functionResponseParts);
                const followUpResponse = followUpResult.response;

                // Extract text from the follow-up
                const followUpParts = followUpResponse.candidates?.[0]?.content?.parts || [];
                for (const part of followUpParts) {
                    if (part.text) text += part.text;
                }

                // Check if the follow-up also has function calls (chain them)
                try {
                    const moreCalls = followUpResponse.functionCalls() || [];
                    if (moreCalls.length > 0) {
                        functionCalls = [...functionCalls, ...moreCalls];
                    }
                } catch (_) { }

            } catch (followUpError) {
                console.error("[Companion] Follow-up after function calls failed:", followUpError);
            }
        }

        // Final fallback: if still no text after the multi-turn loop,
        // generate a contextual message from the tool call arguments
        if (!text.trim() && functionCalls.length > 0) {
            const fallbackParts: string[] = [];
            for (const fc of functionCalls) {
                if (fc.name === 'navigate_resource') {
                    const node = fc.args?.node_id;
                    const page = fc.args?.page;
                    const ts = fc.args?.timestamp;
                    const ctx = fc.args?.context || fc.args?.concept || '';
                    fallbackParts.push(`Let me take you to ${node ? `Node: ${node}` : page ? `Page ${page}` : ts || 'the relevant section'}${ctx ? ` — ${ctx}` : ''}.`);
                } else if (fc.name === 'update_milestone') {
                    fallbackParts.push(`${fc.args?.status === 'completed' ? '✅ Completed' : '▶️ Starting'}: **${fc.args?.label}**`);
                } else if (fc.name === 'park_topic') {
                    fallbackParts.push(`📌 Parked for later: **${fc.args?.topic}**`);
                }
            }
            text = fallbackParts.length > 0 ? fallbackParts.join('\n\n') : "Let me show you something relevant...";
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
