
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
                                        activityType: { type: SchemaType.STRING, description: "One of: 'read', 'quiz', 'flashcards'" },
                                        reasoning: { type: SchemaType.STRING, description: "Why this task on this day?" }
                                    },
                                    required: ["dateString", "topicName", "activityType"]
                                }
                            }
                        },
                        required: ["goal", "phase", "tasks"]
                    }
                }
            ]
        }
    ]
});

console.log("Gemini Model Initialized: gemini-3-flash-preview (Agentic Mode)");

// Helper to fetch and convert URL to Base64
async function urlToGenerativePart(url: string, mimeType: string) {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    return {
        inlineData: {
            data: Buffer.from(buffer).toString("base64"),
            mimeType
        },
    };
}

export async function analyzeDocument(fileUrl: string) {
    const prompt = `
    You are Studdy, an elite academic strategist. 
    Analyze the attached course document (PDF, Image, or Text).
    
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
        console.log("Fetching file for Gemini Multimodal:", fileUrl);
        const filePart = await urlToGenerativePart(fileUrl, "application/pdf");

        const result = await model.generateContent([prompt, filePart]);
        const response = result.response;
        const text = response.text();

        // Clean up functionality to ensure JSON
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonString);
    } catch (error) {
        console.error("Gemini Multimodal Analysis Failed:", error);
        return null;
    }
}

export async function chatWithAgent(message: string, history: any[], contextText: string = "") {
    const systemInstruction = `
    You are Studdy, a loyal and intelligent Study Companion (The "Buddy").
    Your Mission: Collaborate with the user to build a realistic Study Plan.
    
    TONE:
    - Friendly, encouraging, and "in the trenches" with them.
    - Proactive but collaborative.
    
    CONTEXT:
    The user is taking a course.
    Here is the Knowledge Base (Distilled Intelligence) of the syllabus:
    "${contextText.substring(0, 500000)}"
    
    The current date is: ${new Date().toISOString().split('T')[0]}

    GOAL:
    1. Understand the user's exam dates and constraints.
    2. Propose a schedule.
    3. IMPORTANT: Once the user explicitly agrees to the schedule, YOU MUST CALL THE 'commit_study_plan' TOOL.
       - Do not just say "Okay I saved it". You must actually trigger the tool.
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
            maxOutputTokens: 1000,
        },
    });

    try {
        const result = await chat.sendMessage(message);

        // CHECK FOR TOOL CALLS
        const calls = result.response.functionCalls();
        if (calls && calls.length > 0) {
            console.log("🚀 AGENT IS TRIGGERING A TOOL:", calls[0].name);
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

    } catch (error) {
        console.error("Gemini Chat Failed:", error);
        return { type: 'error', content: "I'm having trouble connecting. Please try again." };
    }
}
