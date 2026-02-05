
import { SchemaType } from "@google/generative-ai";
import { genAI, AI_MODEL } from "./ai-config";

// Use centralized model config with tools for planning agent
const model = genAI.getGenerativeModel({
    model: AI_MODEL,
    // Define the Agent's "Hands" (Tools)
    tools: [
        {
            functionDeclarations: [
                {
                    name: "commit_study_plan",
                    description: "Saves the agreed-upon study plan to the database. Call this ONLY when the user explicitly agrees to the proposed schedule.",
                    parameters: {
                        type: SchemaType.OBJECT,
                        properties: {
                            goal: { type: SchemaType.STRING, description: "The user's stated goal (e.g. 'Get an A')" },
                            phase: { type: SchemaType.STRING, description: "The phase strategy (e.g. 'Foundation', 'Cram')" },
                            tasks: {
                                type: SchemaType.ARRAY,
                                description: "List of daily tasks",
                                items: {
                                    type: SchemaType.OBJECT,
                                    properties: {
                                        dateString: { type: SchemaType.STRING, description: "ISO Date String (YYYY-MM-DD) for the task" },
                                        topicName: { type: SchemaType.STRING, description: "What to study" },
                                        reasoning: { type: SchemaType.STRING, description: "Why this task on this day?" }
                                    },
                                    required: ["dateString", "topicName"]
                                }
                            }
                        },
                        required: ["goal", "phase", "tasks"]
                    }
                }
            ]
        }
    ]
}, {
    timeout: 180000 // 3 Minutes Timeout for long chains
});

console.log(`[Planning Agent] Using model: ${AI_MODEL}`);

// Helper to fetch and convert URL to Base64
async function urlToGenerativePart(url: string, mimeType: string) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    return {
        inlineData: {
            data: Buffer.from(buffer).toString("base64"),
            mimeType
        },
    };
}

export async function analyzeDocument(fileUrl: string, mimeType: string = "application/pdf") {
    const prompt = `
    You are Studdy, an AI study companion designed to help students learn effectively.
    Analyze the attached document thoroughly.
    
    GOAL: Create a structured learning guide that a companion AI can use to teach this content.
    
    INSTRUCTIONS:
    1. Extract ALL key concepts, organized by topic/chapter.
    2. For each concept, note WHERE it appears (page number, section, or timestamp).
    3. Identify prerequisite relationships (what should be learned first).
    4. Note areas that are typically challenging for students.
    5. Create the "distilled_content" - a comprehensive extraction of the actual content.
    
    OUTPUT JSON FORMAT:
    {
       "summary": "Brief 2-sentence summary of what this document covers...",
       
       "distilled_content": "COMPREHENSIVE extraction of the document content. Include chapter titles, key definitions, formulas, examples, and important details. This is what the companion will reference when teaching.",
       
       "learning_map": [
           {
               "topic": "Chapter/Section name",
               "concepts": [
                   {
                       "name": "Concept name (e.g., 'Variable Declaration')",
                       "location": "Page 5" or "Section 2.1" or "0:45-1:30",
                       "prerequisites": ["Previous concept name if any"],
                       "difficulty": "beginner" | "intermediate" | "advanced",
                       "key_points": ["Main idea 1", "Main idea 2"]
                   }
               ]
           }
       ],
       
       "suggested_order": ["Concept 1", "Concept 2", "..."],
       
       "total_concepts": 12
    }
  `;

    try {
        console.log(`[Gemini] Starting analysis for: ${fileUrl} (${mimeType})`);
        console.log(`[Gemini] Using Model: ${model.model}`);

        const filePart = await urlToGenerativePart(fileUrl, mimeType);

        console.log("[Gemini] Sending request to Google AI...");
        const result = await model.generateContent([prompt, filePart]);
        const response = result.response;
        const text = response.text();
        console.log("[Gemini] Raw Response Preview:", text.substring(0, 100) + "...");

        // Clean up functionality to ensure JSON
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonString);
    } catch (error: any) {
        console.error("Gemini Multimodal Analysis Failed:", error);
        if (error.response) {
            console.error("Gemini API Error Details:", JSON.stringify(error.response, null, 2));
        }
        return null;
    }
}

export async function chatWithAgent(message: string, history: any[], contextText: string = "") {
    const systemInstruction = `
    You are Studdy, a warm and supportive study companion.
    
    WHO YOU ARE:
    - A friendly study buddy who helps plan what to learn and when
    - You're here to make studying easier, not to lecture or test
    - You adapt to how they learn - some want deep dives, others want quick hits
    
    YOUR APPROACH:
    1. Look at what they're learning and figure out the best path through it
       - "I looked through your Python notes. If you want to build that project, we can skip the GUI stuff and focus on data structures first."
    2. Work WITH them, not FOR them
       - "How does this feel? Want to go faster or take it easy?"
    3. When you've agreed on a plan, use the 'commit_study_plan' tool to save it
    
    TONE:
    - Friendly, warm, helpful
    - Like a friend who's good at studying helping you out
    - Use Markdown for clarity
    
    WHAT YOU KNOW:
    "${contextText.substring(0, 500000)}"
    
    Today's Date: ${new Date().toISOString().split('T')[0]}
    `;

    // 2. Start Chat
    const chat = model.startChat({
        history: [
            {
                role: "user",
                parts: [{ text: `SYSTEM_INSTRUCTION: ${systemInstruction}` }],
            },
            {
                role: "model",
                parts: [{ text: "Hey! I've looked through your materials. Ready to plan this out together?" }],
            },
            ...history
        ],
        generationConfig: {
            maxOutputTokens: 8192,
            temperature: 0.7,
        },
    });

    // 3. Send Message with Auto-Retry
    let attempt = 0;
    const MAX_RETRIES = 3;

    while (attempt < MAX_RETRIES) {
        try {
            const result = await chat.sendMessage(message);

            // CHECK FOR TOOL CALLS
            const calls = result.response.functionCalls();
            if (calls && calls.length > 0) {
                // Return the tool call data so the server action can execute it
                return {
                    type: 'tool_call',
                    toolName: calls[0].name,
                    args: calls[0].args
                };
            }

            // Normal Text Response
            return {
                type: 'text',
                content: result.response.text()
            };

        } catch (error: any) {
            attempt++;
            console.warn(`[Gemini] Attempt ${attempt} failed:`, error.message);

            if (attempt >= MAX_RETRIES) {
                console.error("[Gemini] All retries exhausted.");
                // Return a specific error object so the UI/DB knows it failed but preserves context
                return {
                    type: 'error',
                    content: "I'm having trouble reaching the extensive knowledge base right now. Please tell me to 'try again' or continue."
                };
            }

            // Exponential Backoff (1s, 2s, 4s...)
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
        }
    }

    return { type: 'error', content: "Unexpected error." };
}
