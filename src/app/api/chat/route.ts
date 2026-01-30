import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dbConnect from '@/lib/db';
import Resource from '@/models/Resource';
import Course from '@/models/Course';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

export async function POST(req: NextRequest) {
    try {
        const { message, history, courseId } = await req.json();

        await dbConnect();

        // 1. Fetch Context (The Intel)
        // For MVP, we get all text from the course. 
        // Gemini 1.5 Pro has 1M token window, so we can stuff a LOT of text in.
        let context = "";

        // If no courseId provided, find the most recent one
        let targetCourseId = courseId;
        if (!targetCourseId) {
            const lastCourse = await Course.findOne().sort({ createdAt: -1 });
            if (lastCourse) targetCourseId = lastCourse._id;
        }

        if (targetCourseId) {
            const resources = await Resource.find({ courseId: targetCourseId });
            context = resources.map(r => `--- SOURCE: ${r.title} ---\n${r.extractedText}\n`).join("\n");
        }

        // 2. Construct Prompt
        const systemInstruction = `
        You are Studdy, an elite academic strategist and "Buddy".
        
        YOUR GOAL: Help the user master their course material.
        
        CONTEXT (The Intel):
        ${context ? context : "No course materials uploaded yet."}
        
        INSTRUCTIONS:
        - Use the provided CONTEXT to answer. Cite your sources (e.g. "According to Lecture 1...").
        - Be encouraging, concise, and game-like. use words like "Mission", "Intel", "Strategy", "Win".
        - If the user asks something not in the context, say you don't have that intel yet.
        - Format with Markdown (bolding key terms).
    `;

        // 3. Generate Stream
        const chat = model.startChat({
            history: history || [],
            systemInstruction: { role: 'model', parts: [{ text: systemInstruction }] },
        });

        const result = await chat.sendMessageStream(message);
        const stream = new ReadableStream({
            async start(controller) {
                for await (const chunk of result.stream) {
                    const chunkText = chunk.text();
                    controller.enqueue(new TextEncoder().encode(chunkText));
                }
                controller.close();
            },
        });

        return new NextResponse(stream);

    } catch (error) {
        console.error("Chat API Error:", error);
        return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
    }
}
