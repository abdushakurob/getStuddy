
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

        // Determine resource type from MIME
        const resourceType = fileType.startsWith('image') ? 'image' :
            fileType.startsWith('audio') ? 'audio' :
                fileType.startsWith('video') ? 'video' : 'pdf';

        // 1. Create Resource Entry (Processing State)
        const resource = await Resource.create({
            courseId: metadata.courseId,
            folderId: metadata.folderId === 'null' ? null : metadata.folderId,
            userId: metadata.userId,
            title: file.name,
            type: resourceType,
            fileUrl: file.url,
            status: 'processing',
            retryCount: 0
        });

        // 2. Trigger Gemini Analysis (Background - Fire and Forget)
        (async () => {
            try {
                const analysis = await analyzeDocument(file.url, fileType);

                if (analysis) {
                    resource.knowledgeBase = analysis.distilled_content || analysis.summary;
                    resource.summary = analysis.summary;

                    // Save structured learning data
                    if (analysis.learning_map) {
                        resource.learningMap = analysis.learning_map;
                    }
                    if (analysis.suggested_order) {
                        resource.suggestedOrder = analysis.suggested_order;
                    }
                    if (analysis.total_concepts) {
                        resource.totalConcepts = analysis.total_concepts;
                    }

                    resource.status = 'ready';
                    resource.errorMessage = undefined;
                } else {
                    resource.status = 'error';
                    resource.errorMessage = 'AI analysis returned empty result';
                }
                await resource.save();

            } catch (e: any) {
                console.error("Analysis Failed:", e);
                resource.status = 'error';
                resource.errorMessage = e?.message || 'Unknown analysis error';
                resource.retryCount = (resource.retryCount || 0) + 1;
                await resource.save();
            }
        })();

    } catch (error: any) {
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
