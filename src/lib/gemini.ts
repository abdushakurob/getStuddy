import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.warn("GEMINI_API_KEY is missing. AI features will not work.");
}

const genAI = new GoogleGenerativeAI(apiKey || "PENDING_KEY");

// Use 1.5 Flash for speed and availability (Pro failed with 404)
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
console.log("Gemini Model Initialized: gemini-1.5-flash");

export async function analyzeDocument(text: string) {
    const prompt = `
    You are Studdy, an elite academic strategist. 
    Analyze the following course document (Lecture notes, syllabus, or reading material).
    
    GOAL: Create a structured "Mission Map" (Syllabus) for the student.
    
    INSTRUCTIONS:
    1. Extract the key Topics and Sub-topics.
    2. Identify the "Critical Weaknesses" (concepts that look complex/difficult).
    3. Generate a summary of what this document covers.
    
    OUTPUT JSON FORMAT:
    {
       "summary": "Brief 2-sentence summary...",
       "topics": [
          {
             "name": "Topic Name",
             "status": "locked",
             "complexity": "High/Medium/Low"
          }
       ]
    }
    
    DOCUMENT TEXT:
    ${text.substring(0, 500000)} 
  `;
    // Note: We truncate to 500k chars just to be safe, though 1.5 Pro can handle more.

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Clean up functionality to ensure JSON
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonString);
    } catch (error) {
        console.error("Gemini Analysis Failed:", error);
        return null;
    }
}

export async function chatWithAgent(message: string, history: any[], contextText: string = "") {
    // 1. System Instruction as the "First" part of the chat or configured in model
    const systemInstruction = `
    You are Studdy, a loyal and intelligent Study Companion (The "Buddy").
    Your Mission: Collaborate with the user to build a realistic Study Plan.
    
    TONE:
    - Friendly, encouraging, and "in the trenches" with them.
    - Intelligent but approachable. Think "Hermione Granger" meets "Baymax".
    - Proactive but collaborative. Ask "How does that feel?" instead of "Do this."
    
    CONTEXT:
    The user is taking a course.
    Here is the content of the syllabus/materials so far:
    "${contextText.substring(0, 100000)}"
    
    GOAL:
    1. Understand the user's exam dates.
    2. Understand their available study hours and stress levels.
    3. Propose a "Mission Map" (Study Schedule) that feels achievable.
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
            maxOutputTokens: 500,
        },
    });

    try {
        const result = await chat.sendMessage(message);
        return result.response.text();
    } catch (error) {
        console.error("Gemini Chat Failed:", error);
        return "I'm having trouble connecting to the network. Please try again.";
    }
}
