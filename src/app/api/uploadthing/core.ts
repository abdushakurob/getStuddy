import { createUploadthing, type FileRouter } from "uploadthing/next";
import { loadPdfFromUrl } from "@/lib/pdf-loader";
import { analyzeDocument } from "@/lib/gemini"; // We will implement/fix this later
import dbConnect from "@/lib/db";
import Resource from "@/models/Resource";
import { auth } from "@/auth"; // Real Auth
import { z } from "zod";

const f = createUploadthing();

export const ourFileRouter = {
    resourceUploader: f({ pdf: { maxFileSize: "16MB", maxFileCount: 4 } })
        .input(z.object({
            courseId: z.string(),
            folderId: z.string() // Always string, "null" if root
        }))
        .middleware(async ({ req, input }) => {
            console.log("Upload Middleware Input (Server):", input);
            const session = await auth();
            const user = session?.user;
            if (!user || !user.id) throw new Error("Unauthorized");

            // Return strings ONLY for metadata safety
            return {
                userId: user.id,
                courseId: input.courseId,
                folderContext: input.folderId // Values: "null" or "abc1234"
            };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Upload Complete. Metadata:", metadata);

            // Parse context string back to ObjectId-compatible value
            // "null" string -> null value
            // "abc" string -> "abc" value
            const finalFolderId = metadata.folderContext === "null" ? null : metadata.folderContext;

            console.log(`[onUploadComplete] Final Folder ID Strategy: '${metadata.folderContext}' ->`, finalFolderId);

            try {
                await dbConnect();

                // 1. Download & Parse PDF
                console.log("Downloading and parsing PDF...");
                const text = await loadPdfFromUrl(file.url);
                console.log("PDF parsed. Text length:", text.length);

                // 2. Analyze with Gemini
                console.log("Analyzing with Gemini...");
                const analysis = await analyzeDocument(text);

                // 3. Save Resource with Intel
                const resource = await Resource.create({
                    courseId: metadata.courseId,
                    folderId: finalFolderId, // Use the parsed value
                    userId: metadata.userId,
                    title: file.name,
                    fileUrl: file.url,
                    extractedText: text, // Store full text for RAG later
                    summary: analysis?.summary || "No summary generated",
                    status: 'ready'
                });
                console.log("Resource created:", resource._id);

                // 4. Create Topics (The Plan Blocks)
                // Note: We need a Topic model or just save to Course? 
                // For now, let's assume we might not have Topic model yet, check imports.
                // Re-checking imports... YES we removed Topic import in previous step.
                // Let's just store topics in the Resource for now, or log them.
                if (analysis?.topics) {
                    console.log("Identified Topics:", analysis.topics);
                    // TODO: Save these to a 'StudyPlan' or 'Topic' collection/field
                }

            } catch (error) {
                console.error("Upload Warning:", error);
            }

            return { uploadedBy: metadata.userId };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
