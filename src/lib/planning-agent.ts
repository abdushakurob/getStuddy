import { genAI } from '@/lib/ai-config';

export interface MilestoneDraft {
    label: string;
    reasoning: string;
}

export async function generateSessionMilestones(topic: string, contextSummary: string = ""): Promise<MilestoneDraft[]> {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.3
            }
        });

        const prompt = `
            Act as an expert curriculum designer.
            Your task is to break down the topic "${topic}" into a logical learning path of 3-5 milestones for a single study session.
            
            Context about the material:
            "${contextSummary.slice(0, 5000)}"

            Rules:
            1. Assess the topic complexity. Create between 3 and 8 milestones.
            2. If simple/short, use 3-4. If complex/deep, use 6-8.
            3. They must be linear (logical flow).
            4. "Label" should be short (3-6 words).
            5. "Reasoning" explains why this step is necessary.
            6. The first milestone should be foundational.
            7. The last milestone should be synthesis or application.

            Output Format:
            A JSON Array of objects: [{ "label": "...", "reasoning": "..." }]
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        const milestones = JSON.parse(text);

        // Validation check
        if (Array.isArray(milestones)) {
            return milestones.slice(0, 10).map(m => ({
                label: String(m.label),
                reasoning: String(m.reasoning)
            }));
        }
        return [];

    } catch (error) {
        console.error("Failed to generate milestones:", error);
        // Fallback milestones
        return [
            { label: "Understand Core Concepts", reasoning: "Start with the basics." },
            { label: "Practice Examples", reasoning: "Apply what you learned." },
            { label: "Review & Summary", reasoning: "Consolidate knowledge." }
        ];
    }
}
