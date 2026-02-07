
import { SchemaType } from "@google/generative-ai";
import { genAI, AI_MODEL } from "./ai-config";

// Separate model for document analysis (no tools, JSON output)
const analysisModel = genAI.getGenerativeModel({
    model: AI_MODEL,
    generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2, // Lower for more consistent structured output
    }
});

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
    You are Studdy, an AI companion that helps users understand and learn from any document.
    Analyze the attached document thoroughly.
    
    GOAL: Create a structured guide that an AI companion can use to help the user understand this content.
    
    DOCUMENT TYPES YOU MIGHT ENCOUNTER:
    - Educational: Textbooks, lecture notes, tutorials → Extract concepts and learning objectives
    - Technical: Manuals, documentation, guides → Extract procedures, steps, and key information
    - Literary: Novels, stories, articles → Extract themes, plot points, key ideas
    - Research: Papers, reports, studies → Extract findings, methodology, conclusions
    - Reference: Dictionaries, encyclopedias, handbooks → Extract entries and definitions
    - Academic Planning: Syllabi, timetables, schedules, course outlines → Extract dates, topics, deadlines, requirements
    - Business: Proposals, plans, presentations → Extract key points and action items
    
    Instructions for ANALYSIS:
    1. Identify the document type.
    2. **COMPREHENSIVE EXTRACTION**: Do not summarize just the first page. Scan the WHOLE document.
    3. Extract EVERYTHING useful:
       - **Concepts/Topics**: What is being taught?
       - **Schedule/Timeline**: If there are dates, weeks, or units, extract them.
       - **Requirements/Deliverables**: Assignments, quizzes, exams, weightings.
       - **Policies/Rules**: Prerequisites, software requirements, citations.
    
    4. Construct the output:
       - 'distilled_content': A structured, readable digest of ALL the above.
       - 'learning_map': Structured hierarchy of the main topics/units.
    
    OUTPUT JSON FORMAT:
    {
       "summary": "Brief 2-sentence summary of what this document is and covers",
       
       "document_type": "educational" | "technical" | "literary" | "research" | "reference" | "academic_planning" | "business" | "other",
       
       "distilled_content": "REQUIRED: A comprehensive, structured text version of the document. Include the full schedule (if present), key concepts, grading criteria, and requirements. Keep it organized.",
       
       "learning_map": [
           {
               "topic": "Unit 1: Introduction", 
               "concepts": [
                   { 
                       "name": "Programming Fundamentals (Concept)", 
                       "location": "Page 2",
                       "difficulty": "beginner",
                       "key_points": ["Definition of variable", "Syntax rules"]
                   },
                   {
                        "name": "Assignment 1 (Deliverable)",
                        "location": "Week 1",
                        "difficulty": "intermediate",
                        "key_points": ["Due: Sunday", "Worth 5%"]
                   }
               ]
           }
       ],
       
       "suggested_order": ["Topic 1", "Topic 2"],
       
       "total_concepts": 12
    }
  `;

    try {
        console.log(`[Gemini] Starting analysis for: ${fileUrl} (${mimeType})`);
        console.log(`[Gemini] Using Analysis Model with JSON mode`);

        const filePart = await urlToGenerativePart(fileUrl, mimeType);

        console.log("[Gemini] Sending request to Google AI...");
        // Use the analysis model with JSON response mode
        const result = await analysisModel.generateContent([prompt, filePart]);
        const response = result.response;
        const text = response.text();
        console.log("[Gemini] Raw Response Preview:", text.substring(0, 100) + "...");

        // With responseMimeType: "application/json", the response should be pure JSON
        // But add fallback extraction just in case
        let jsonString = text.trim();

        // If it starts with text before JSON, try to extract JSON
        if (!jsonString.startsWith('{')) {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                jsonString = jsonMatch[0];
                console.log("[Gemini] Extracted JSON from response");
            }
        }

        // Clean markdown code blocks if present
        jsonString = jsonString.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

        // Try parsing, if it fails, attempt to repair common issues
        try {
            return JSON.parse(jsonString);
        } catch (parseError: any) {
            console.log("[Gemini] Initial JSON parse failed, attempting repair...");

            // Common fixes for malformed JSON from LLMs:
            // 1. Fix unescaped newlines in strings
            let repaired = jsonString.replace(/(?<!\\)\n/g, '\\n');

            // 2. Fix unescaped tabs
            repaired = repaired.replace(/(?<!\\)\t/g, '\\t');

            // 3. Try again
            try {
                return JSON.parse(repaired);
            } catch (e2) {
                console.log("[Gemini] Repair attempt 1 failed, trying simpler extraction...");

                // Last resort: try to extract just the critical fields
                try {
                    const summaryMatch = text.match(/"summary"\s*:\s*"([^"]+)"/);
                    const totalMatch = text.match(/"total_concepts"\s*:\s*(\d+)/);

                    if (summaryMatch) {
                        console.log("[Gemini] Extracted partial data from malformed JSON");
                        return {
                            summary: summaryMatch[1],
                            distilled_content: summaryMatch[1], // Use summary as fallback
                            learning_map: [],
                            suggested_order: [],
                            total_concepts: totalMatch ? parseInt(totalMatch[1]) : 0
                        };
                    }
                } catch (e3) {
                    // Give up
                }

                throw parseError; // Re-throw original error
            }
        }
    } catch (error: any) {
        console.error("Gemini Multimodal Analysis Failed:", error);
        if (error.response) {
            console.error("Gemini API Error Details:", JSON.stringify(error.response, null, 2));
        }
        return null;
    }
}

export async function chatWithAgent(message: string, history: any[], contextText: string = "") {
    // Check if we have materials available
    const hasMaterials = !contextText.includes("NO MATERIALS UPLOADED YET") &&
        !contextText.includes("NO USABLE MATERIALS YET") &&
        !contextText.includes("[No analyzed materials available yet]");

    const systemInstruction = `
    You are Studdy, a warm and supportive study companion.
    
    WHO YOU ARE:
    - A friendly study buddy who helps plan what to learn and when
    - You're here to make studying easier, not to lecture or test
    - You adapt to how they learn - some want deep dives, others want quick hits
    
    YOUR APPROACH:
    ${hasMaterials ? `
    1. You have access to their study materials - USE THEM!
       - Reference specific topics you found: "I see you have chapters on X, Y, and Z..."
       - Create plans based on ACTUAL content, not generic topics
    2. Work WITH them, not FOR them
       - "How does this feel? Want to go faster or take it easy?"
    3. When you've agreed on a plan, use the 'commit_study_plan' tool to save it
    ` : `
    1. NO MATERIALS YET - Important!
       - The user hasn't uploaded any study materials, or they're still being processed
       - DO NOT ask them to tell you what topics they have - that defeats the purpose!
       - Instead, encourage them to upload their PDFs, slides, or notes
       - You can discuss their goals and timeline, but don't commit a plan without content
       - Example: "Before we create your study plan, could you upload your course materials? 
         Once I can see what you're studying, I'll create a personalized plan that covers everything."
    2. If files are processing, let them know to wait a bit
    3. If files failed, suggest they re-upload them
    `}
    
    IMPORTANT RULES:
    - DON'T commit a plan if there are no ready materials (you'll create a useless generic plan)
    - DON'T ask the user to list their topics - you should know from their materials!
    - DO encourage uploading if no materials exist
    - DO reference specific content when materials ARE available
    
    TONE:
    - Friendly, warm, helpful
    - Like a friend who's good at studying helping you out
    - Use Markdown for clarity
    
    CONTEXT (Resource status + content + other plans):
    "${contextText.substring(0, 500000)}"
    
    Today's Date: ${new Date().toISOString().split('T')[0]}
    `;

    // Dynamic initial greeting based on material status
    const initialGreeting = hasMaterials
        ? "Hey! I've looked through your materials and I have some ideas. What's your goal with this course?"
        : "Hey! I'm ready to help you plan your studies. I noticed you haven't uploaded any materials yet - once you add your PDFs or notes, I can create a personalized study plan based on exactly what you need to learn. What course is this for?";

    // 2. Start Chat
    const chat = model.startChat({
        history: [
            {
                role: "user",
                parts: [{ text: `SYSTEM_INSTRUCTION: ${systemInstruction}` }],
            },
            {
                role: "model",
                parts: [{ text: initialGreeting }],
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
// Analyze YouTube Video via LLM (Multimodal)
export async function analyzeYouTubeVideo(url: string) {
    const promptText = `
    You are Studdy. I have provided a YouTube video as context.
    Analyze the video content thoroughly.
    
    GOAL: Create a structured learning guide.
    
    CRITICAL: 
    - Output PURE JSON. No markdown formatting.
    - Escape ALL double quotes inside strings (e.g. \"content\").
    - Escape newlines as \\n.
    - difficulty MUST be exactly: "beginner", "intermediate", or "advanced".
    
    OUTPUT JSON FORMAT:
    {
        "document_type": "video_lecture",
        "summary": "Brief summary of the video content...",
        "distilled_content": "Detailed markdown notes of the key concepts...",
        "learning_map": [
            { "label": "Topic 1", "page": "0:00", "difficulty": "beginner" },
            { "label": "Topic 2", "page": "5:00", "difficulty": "intermediate" }
        ],
        "total_concepts": 5
    }
    `;

    try {
        // Gemini 2.5+ supports YouTube URLs directly in fileData
        const parts = [
            {
                fileData: {
                    fileUri: url,
                    mimeType: "video/mp4"
                }
            },
            { text: promptText }
        ];

        const result = await analysisModel.generateContent(parts as any);
        const response = result.response;
        const text = response.text();

        // Robust JSON Extraction
        let jsonString = text.trim();
        if (!jsonString.startsWith('{')) {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) jsonString = jsonMatch[0];
        }
        jsonString = jsonString.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

        let parsedData: any = null;

        try {
            parsedData = JSON.parse(jsonString);
        } catch (e) {
            // Repair: Replace control characters (newlines, tabs, etc.) that are literal
            const repaired = jsonString
                .replace(/[\n\r]/g, '\\n')  // Force newlines to be \n
                .replace(/\t/g, '\\t');     // Force tabs to be \t

            // Repair: Use a state machine for complex escaping
            let robustRepaired = '';
            let insideString = false;
            let isEscaped = false;

            for (let i = 0; i < jsonString.length; i++) {
                const char = jsonString[i];
                if (char === '"' && !isEscaped) insideString = !insideString;
                if (char === '\\' && !isEscaped) isEscaped = true;
                else isEscaped = false;

                if (insideString) {
                    if (char === '\n') robustRepaired += '\\n';
                    else if (char === '\r') robustRepaired += '\\r';
                    else if (char === '\t') robustRepaired += '\\t';
                    else robustRepaired += char;
                } else {
                    robustRepaired += char;
                }
            }

            try {
                parsedData = JSON.parse(robustRepaired);
            } catch (e2) {
                console.error("Gemini JSON Repair Failed:", (e2 as any).message);

                // FINAL RESCUE: Regex Extraction
                const summaryMatch = text.match(/"summary"\s*:\s*"((?:[^"\\]|\\.)*)"/);
                const distilledMatch = text.match(/"distilled_content"\s*:\s*"((?:[^"\\]|\\.)*)"/);

                if (summaryMatch && distilledMatch) {
                    console.log("[Gemini] Rescued partial data via Regex!");
                    parsedData = {
                        document_type: "video_lecture",
                        summary: summaryMatch[1],
                        distilled_content: distilledMatch[1],
                        learning_map: [],
                        suggested_order: [],
                        total_concepts: 0
                    };
                } else {
                    throw new Error("Failed to parse Gemini JSON response");
                }
            }
        }

        // SANITIZATION: Fix Enum Violations (difficulty)
        if (parsedData && parsedData.learning_map) {
            parsedData.learning_map.forEach((item: any) => {
                const validDiffs = ['beginner', 'intermediate', 'advanced'];
                if (!item.difficulty || !validDiffs.includes(item.difficulty)) {
                    // Map common hallucinations or default
                    if (item.difficulty === 'low') item.difficulty = 'beginner';
                    else if (item.difficulty === 'medium') item.difficulty = 'intermediate';
                    else if (item.difficulty === 'high') item.difficulty = 'advanced';
                    else item.difficulty = 'beginner';
                }
            });
        }

        return parsedData;

    } catch (e) {
        console.error("Gemini YouTube Analysis System Error:", e);
        throw e;
    }
}
