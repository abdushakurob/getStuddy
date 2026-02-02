
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Resource from "@/models/Resource";
import { analyzeDocument } from "@/lib/gemini";
import { z } from "zod";

const f = createUploadthing();

// File handling logic
const handleFile = async ({ file, metadata }: any) => {
    try {
        await dbConnect();

        // Get safe file type
        const fileType = file.type || 'application/pdf'; // Fallback if type is missing

        // 1. Create Resource Entry (Processing State)
        const resource = await Resource.create({
            courseId: metadata.courseId,
            folderId: metadata.folderId === 'null' ? null : metadata.folderId, // Handle unassigned
            userId: metadata.userId,
            title: file.name,
            type: fileType.startsWith('image') ? 'image' :
                fileType.startsWith('audio') ? 'audio' :
                    fileType.startsWith('video') ? 'video' : 'pdf',
            fileUrl: file.url,
            status: 'processing'
        });

        // 2. Trigger Gemini Analysis (Background - Fire and Forget)
        (async () => {
            try {
                const analysis = await analyzeDocument(file.url, fileType);

                if (analysis) {
                    resource.knowledgeBase = analysis.distilled_content || analysis.summary;
                    resource.summary = analysis.summary;
                    resource.status = 'ready';
                } else {
                    resource.status = 'error';
                }
                await resource.save();

            } catch (e) {
                console.error("Analysis Failed:", e);
                resource.status = 'error';
                await resource.save();
            }
        })();

    } catch (error) {
        console.error("[UploadThing] CRITICAL FAILURE in handleFile:", error);
    }
};

export const ourFileRouter = {
    resourceUploader: f({
        pdf: { maxFileSize: "16MB", maxFileCount: 5 },
        image: { maxFileSize: "8MB", maxFileCount: 5 },
        audio: { maxFileSize: "32MB", maxFileCount: 2 },
        video: { maxFileSize: "64MB", maxFileCount: 1 },
        blob: { maxFileSize: "16MB", maxFileCount: 5 } // Fallback for other types
    })
        .input(z.object({
            courseId: z.string(),
            folderId: z.string().optional() // "null" string or undefined
        }))
        .middleware(async ({ req, input }) => {
            const session = await auth();
            if (!session?.user?.id) throw new Error("Unauthorized");

            // Input is now typed and available
            return { userId: session.user.id, courseId: input.courseId, folderId: input.folderId };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            await handleFile({ file, metadata });
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
