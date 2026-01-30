import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.warn("GEMINI_API_KEY is missing. AI features will not work.");
}

const genAI = new GoogleGenerativeAI(apiKey || "PENDING_KEY");

// Use 1.5 Pro for large context windows (1M tokens) is essential for full PDF analysis
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

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
