import { createUploadthing, type FileRouter } from "uploadthing/next";
import { loadPdfFromUrl } from "@/lib/pdf-loader";
import { analyzeDocument } from "@/lib/gemini";
import dbConnect from "@/lib/db";
import Resource from "@/models/Resource";
import Course from "@/models/Course";
import { auth } from "@/auth";
import { z } from "zod";
import mongoose from 'mongoose';

const f = createUploadthing();

export const ourFileRouter = {
    resourceUploader: f({ pdf: { maxFileSize: "16MB", maxFileCount: 4 } })
        .input(z.object({
            courseId: z.string().optional(),
            folderId: z.string().optional()
        }))
        .middleware(async ({ req, input }) => {
            console.log("Upload Middleware Input (Server):", input);
            const session = await auth();
            const user = session?.user;
            if (!user || !user.id) throw new Error("Unauthorized");

            // Return strings ONLY for metadata safety
            return {
                userId: user.id,
                courseId: input?.courseId,
                folderContext: input?.folderId // Values: "null" or "abc1234"
            };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Upload Complete. Metadata:", metadata);

            try {
                await dbConnect();

                // Explicit ObjectId Casting for Folder
                let finalFolderId = null;
                if (metadata.folderContext && metadata.folderContext !== "null") {
                    try {
                        finalFolderId = new mongoose.Types.ObjectId(metadata.folderContext);
                    } catch (e) {
                        console.error("Invalid Folder ID format:", metadata.folderContext);
                        finalFolderId = null;
                    }
                }

                // Handle Missing Course ID -> Create New Course
                let finalCourseId = metadata.courseId;
                if (!finalCourseId) {
                    console.log("No Course ID provided. Creating new default course...");
                    // Need to dynamic import or ensure Course is registered if using mongoose.models
                    // Importing Course at top level is better.
                    // For now, let's use the local import inside logic or assume it is imported at top
                    // I will add the import at the top in a separate edit or this one if I can.

                    // Assuming Course is imported or we use mongoose.model("Course")
                    const CourseModel = mongoose.models.Course || mongoose.model("Course");

                    const newCourse = await CourseModel.create({
                        userId: metadata.userId,
                        title: "New Mission Map",
                        description: "Created from upload",
                        color: "#00F2D3"
                    });
                    finalCourseId = newCourse._id.toString();
                    console.log("Created new Course:", finalCourseId);
                }

                console.log(`[onUploadComplete] Final Folder ID Strategy: '${metadata.folderContext}' ->`, finalFolderId);


                // 1. Prepare Data
                let text = "";
                let summary = "Pending analysis...";
                let topics: any[] = [];
                let status = "ready";

                // 2. Try Parsing (Fail-Safe)
                try {
                    console.log("Downloading and parsing PDF...");
                    const pdfText = await loadPdfFromUrl(file.url);
                    text = pdfText;
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
                console.log(`[onUploadComplete] Saving Resource. Course: ${finalCourseId}, Folder: ${finalFolderId}, Status: ${status}`);
                const resource = await Resource.create({
                    courseId: finalCourseId,
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
