import { createUploadthing, type FileRouter } from "uploadthing/next";
import { loadPdfFromUrl } from "@/lib/pdf-loader";
import { analyzeDocument } from "@/lib/gemini";
import dbConnect from "@/lib/db";
import Resource from "@/models/Resource";
import { auth } from "@/auth";
import { z } from "zod";
import mongoose from 'mongoose';

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

            // Explicit ObjectId Casting
            let finalFolderId = null;
            if (metadata.folderContext && metadata.folderContext !== "null") {
                try {
                    finalFolderId = new mongoose.Types.ObjectId(metadata.folderContext);
                } catch (e) {
                    console.error("Invalid Folder ID format:", metadata.folderContext);
                    finalFolderId = null;
                }
            }

            console.log(`[onUploadComplete] Final Folder ID Strategy: '${metadata.folderContext}' ->`, finalFolderId);

            try {
                await dbConnect();

                // 1. Prepare Data
                let text = "";
                let summary = "Pending analysis...";
                let topics: any[] = [];
                let status = "ready";

                // 2. Try Parsing (Fail-Safe)
                try {
                    console.log("Downloading and parsing PDF...");
                    text = await loadPdfFromUrl(file.url);
                    console.log("PDF parsed. Text length:", text.length);

                    console.log("Analyzing with Gemini...");
                    const analysis = await analyzeDocument(text);
                    if (analysis) {
                        summary = analysis.summary || summary;
                        topics = analysis.topics || [];
                    }
                } catch (parseError) {
                    console.error("PDF Parsing/Analysis Failed:", parseError);
                    summary = "Analysis failed. Please try again.";
                    status = "error";
                    text = "Extraction failed.";
                }

                // 3. Save Resource (ALWAYS)
                console.log(`[onUploadComplete] Saving Resource. Folder: ${finalFolderId}, Status: ${status}`);
                const resource = await Resource.create({
                    courseId: metadata.courseId,
                    folderId: finalFolderId,
                    userId: metadata.userId,
                    title: file.name,
                    fileUrl: file.url,
                    extractedText: text,
                    summary: summary,
                    status: status as any
                });
                console.log("Resource created:", resource._id);

                // 4. Trace Topics
                if (topics.length > 0) {
                    console.log("Identified Topics:", topics);
                }

            } catch (error) {
                console.error("Critical Upload Error:", error);
                // Throwing ensures the client sees 'Failed'
                throw error;
            }

            return { uploadedBy: metadata.userId };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
