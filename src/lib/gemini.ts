
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.warn("GEMINI_API_KEY is missing. AI features will not work.");
}

const genAI = new GoogleGenerativeAI(apiKey || "PENDING_KEY");

// Use 1.5 Flash for speed (Pro is good too, but Flash is snappier for chat)
const model = genAI.getGenerativeModel({
    model: "gemini-3-flash-preview",
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

console.log("Gemini Model Initialized: gemini-3-flash-preview (Agentic Mode)");

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
    You are Studdy, an elite academic strategist. 
    Analyze the attached course document (PDF, Image, Audio, or Text).
    
    GOAL: Create a structured "Mission Map" (Syllabus) for the student.
    
    INSTRUCTIONS:
    1. Extract the key Topics and Sub-topics.
    2. Identify "Critical Weaknesses" (concepts that look complex/difficult).
    3. Generate a "Distilled Knowledge Base" (This is CRITICAL). 
       - This should be a detailed, comprehensive text provided in the 'distilled_content' field.
       - It must cover EVERY chapter, rule, exam date, and core concept found in the file.
       - It must be detailed enough that another AI reading ONLY this text would fully understand the course.
    
    OUTPUT JSON FORMAT:
    {
       "summary": "Brief 2-sentence summary...",
       "distilled_content": "CHAPTER 1: ... (Detailed extraction of content) ... CHAPTER 2: ...",
       "topics": [
          {
             "name": "Topic Name",
             "status": "locked",
             "complexity": "High/Medium/Low"
          }
       ]
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
    You are Studdy, an expert "Learning Strategist".
    
    YOUR TRUTH:
    - The user wants to MASTER this content, not just "pass".
    - They might NOT be in school. They could be self-learning ML, cooking, or coding.
    - Do NOT assume arbitrary deadlines (like "exams") unless told.
    
    YOUR JOB:
    1. Analyze the *Topology* of the Knowledge Base below. (What depends on what?)
    2. Propose the most EFFICIENT path to Mastery.
       - "I've scanned the Python book. To build a neural network (your goal), we can skip the GUI chapters and focus entirely on Data Structures. Here is a sprint plan."
    3. Be a Partner, not a Boss.
       - "Does this pace work for you, or do you want to go hardcore?"
    4. When agreed, CALL THE 'commit_study_plan' TOOL to lock it in.
    
    TONE:
    - Smart, Adaptive, Strategic.
    - "Here is the optimal route."
    - Use Markdown for clarity.
    
    CONTEXT (The Knowledge to Master):
    "${contextText.substring(0, 500000)}"
    
    Current Date: ${new Date().toISOString().split('T')[0]}
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
                parts: [{ text: "Understood. I am ready to plan. What is your status?" }],
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
