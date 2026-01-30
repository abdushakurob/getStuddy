import { createUploadthing, type FileRouter } from "uploadthing/next";
import { loadPdfFromUrl } from "@/lib/pdf-loader";
import { analyzeDocument } from "@/lib/gemini";
import dbConnect from "@/lib/db";
import Resource from "@/models/Resource";
import Topic from "@/models/Topic";
import Course from "@/models/Course";

const f = createUploadthing();

// Placeholder auth function
const auth = (req: Request) => ({ id: "user_123" }); // TODO: Replace with real NextAuth

export const ourFileRouter = {
    resourceUploader: f({ pdf: { maxFileSize: "16MB", maxFileCount: 4 } })
        .middleware(async ({ req }) => {
            const user = await auth(req);
            if (!user) throw new Error("Unauthorized");
            return { userId: user.id };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Upload complete for userId:", metadata.userId);
            console.log("File URL:", file.url);

            try {
                await dbConnect();

                // 1. Download & Parse PDF
                console.log("Downloading and parsing PDF...");
                const text = await loadPdfFromUrl(file.url);
                console.log("PDF parsed. Text length:", text.length);

                // 2. Analyze with Gemini
                console.log("Analyzing with Gemini...");
                const analysis = await analyzeDocument(text);

                // 3. Find or Create a Default Course (For MVP simplicity)
                // In a real app, we'd pass courseId in metadata
                let course = await Course.findOne({ userId: metadata.userId });
                if (!course) {
                    course = await Course.create({
                        userId: metadata.userId,
                        title: "First Course",
                        description: "Auto-generated course from upload"
                    });
                }

                // 4. Save Resource
                const resource = await Resource.create({
                    courseId: course._id,
                    userId: metadata.userId,
                    title: file.name,
                    fileUrl: file.url,
                    extractedText: text,
                    summary: analysis?.summary || "No summary generated",
                    status: 'ready'
                });
                console.log("Resource saved:", resource._id);

                // 5. Create Topics
                if (analysis?.topics && Array.isArray(analysis.topics)) {
                    const topicDocs = analysis.topics.map((t: any) => ({
                        courseId: course._id,
                        name: t.name,
                        complexity: t.complexity || 'Medium',
                        status: 'unlocked'
                    }));
                    await Topic.insertMany(topicDocs);
                    console.log("Topics created:", topicDocs.length);
                }

            } catch (error) {
                console.error("Pipeline Error:", error);
                // We might want to update Resource status to 'error' here if we had the ID
            }

            return { uploadedBy: metadata.userId };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
