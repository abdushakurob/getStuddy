import { genAI, AI_MODEL } from './ai-config';

interface ResourceMetadata {
    _id: string;
    title: string;
    type: string;
    documentType?: string;
    summary?: string;
    knowledgeBase?: string;
}

export async function identifyBestResource(topic: string, resources: ResourceMetadata[]): Promise<string | null> {
    if (!resources || resources.length === 0) return null;
    if (resources.length === 1) return resources[0]._id.toString();

    // Prioritize textbooks/materials over syllabi if the topic is a concept
    // But if topic is "Syllabus Review", prioritize syllabus

    const candidateList = resources.map((r, index) =>
        `${index + 1}. Title: "${r.title}"
   ID: ${r._id}
   Type: ${r.type} (${r.documentType || 'unknown'})
   Summary: ${r.summary ? r.summary.substring(0, 200) + '...' : 'No summary'}
   Start of content: ${r.knowledgeBase ? r.knowledgeBase.substring(0, 150) + '...' : 'N/A'}`
    ).join('\n\n');

    const prompt = `You are a librarian helping a student find the right document for their study session.
    
TOPIC: "${topic}"

AVAILABLE RESOURCES:
${candidateList}

TASK:
Identify the single most relevant resource ID for studying this topic.
- If the topic refers to a specific chapter (e.g. "Chapter 1"), choose the textbook or chapter file.
- If the topic is about the course schedule/policies, choose the syllabus.
- If unsure, choose the most comprehensive textbook/reference.

Return ONLY the ID of the selected resource. No explanation.`;

    try {
        const model = genAI.getGenerativeModel({ model: AI_MODEL });
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();

        // Clean up any extra text if model chats (it shouldn't)
        const selectedId = text.replace(/['"`]/g, '').trim();

        // Verify it exists in our list
        const match = resources.find(r => r._id.toString() === selectedId);
        if (match) return selectedId;

        console.warn("LLM returned invalid resource ID:", selectedId);
        return resources[0]._id.toString(); // Fallback
    } catch (error) {
        console.error("Resource matching failed:", error);
        return resources[0]._id.toString(); // Fallback
    }
}
