'use server';

import { auth } from '@/auth';
import dbConnect from './db';
import Course from '@/models/Course';
import Folder from '@/models/Folder';
import Resource from '@/models/Resource';
import StudyPlan from '@/models/StudyPlan';
import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';

// --- Types ---
export interface CourseData {
    id: string;
    title: string;
    description?: string;
    color: string;
    resourceCount?: number;
    folderCount?: number;
}

export interface FolderData {
    id: string;
    name: string;
    parentId?: string;
}

export interface ResourceData {
    id: string;
    title: string;
    type: 'pdf' | 'slide' | 'note';
    fileUrl: string;
    status: string;
}

// --- Actions ---

export async function getCourses(): Promise<CourseData[]> {
    const session = await auth();
    if (!session?.user?.id) return [];

    await dbConnect();
    const courses = await Course.find({ userId: session.user.id }).sort({ createdAt: -1 }).lean();

    // Aggregate counts safely
    const coursesWithCounts = await Promise.all(courses.map(async (c: any) => {
        const folderCount = await Folder.countDocuments({ courseId: c._id });
        const resourceCount = await Resource.countDocuments({ courseId: c._id });

        return {
            id: c._id.toString(),
            title: c.title,
            description: c.description,
            color: c.color,
            folderCount,    // Return actual count
            resourceCount   // Return actual count
        };
    }));

    return coursesWithCounts;
}

export async function createCourse(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const color = formData.get('color') as string || '#00F2D3'; // Default Studdy Teal

    if (!title) throw new Error('Title is required');

    await dbConnect();
    await Course.create({
        userId: session.user.id,
        title,
        description,
        color,
    });

    revalidatePath('/dashboard/courses'); // Refresh list
}

export async function createFolder(courseId: string, parentId: string | null, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    const name = formData.get('name') as string;
    if (!name) throw new Error('Folder name is required');

    await dbConnect();

    // Validate Course Ownership
    const course = await Course.findOne({ _id: courseId, userId: session.user.id });
    if (!course) throw new Error('Course not found');

    await Folder.create({
        userId: session.user.id,
        courseId,
        parentId: parentId || null, // Ensure explicit null if undefined/empty string
        name,
    });

    revalidatePath(`/dashboard/courses/${courseId}`);
}

export async function getCourseContent(courseId: string, folderId: string | null) {
    const session = await auth();
    if (!session?.user?.id) return { folders: [], resources: [], navigation: [], courseTitle: '' };

    await dbConnect();

    // Verify Course
    console.log(`[getCourseContent] Fetching: courseId=${courseId}, userId=${session.user.id}`);
    const course = await Course.findOne({ _id: courseId, userId: session.user.id }).lean();

    if (!course) {
        console.error(`[getCourseContent] Course not found! Query: { _id: ${courseId}, userId: ${session.user.id} }`);
        const allCourses = await Course.find({ userId: session.user.id }).select('_id title').lean();
        console.log(`[getCourseContent] Available courses for user:`, allCourses);
        throw new Error('Course not found');
    }

    // Fetch Folders in this level
    const folders = await Folder.find({
        courseId,
        userId: session.user.id,
        parentId: folderId || null
    }).sort({ name: 1 }).lean();

    // Fetch Resources in this level
    console.log(`[getCourseContent] Fetching resources for courseId=${courseId}, folderId=${folderId}`);
    const resources = await Resource.find({
        courseId,
        userId: session.user.id,
        folderId: folderId || null // Crucial: match null parent for root resources
    }).sort({ createdAt: -1 }).lean();
    console.log(`[getCourseContent] Found ${resources.length} resources.`);

    // Build Breadcrumbs (Navigation)
    const navigation = [];
    if (folderId) {
        let currentId = folderId;
        while (currentId) {
            const folder = await Folder.findById(currentId).lean() as any;
            if (!folder) break;
            navigation.unshift({ id: folder._id.toString(), name: folder.name });
            currentId = folder.parentId;
        }
    }
    // Prepend Course Root
    navigation.unshift({ id: null, name: (course as any).title });

    // Fetch Active Plan
    const activePlan = await StudyPlan.findOne({
        courseId,
        userId: session.user.id,
        status: 'active'
    }).sort({ createdAt: -1 }).lean();

    return {
        folders: folders.map((f: any) => ({
            id: f._id.toString(),
            name: f.name,
            parentId: f.parentId?.toString()
        })),
        resources: resources.map((r: any) => ({
            id: r._id.toString(),
            title: r.title,
            type: r.type,
            fileUrl: r.fileUrl,
            status: r.status
        })),
        navigation: navigation.map((n: any) => ({
            id: n.id?.toString() || null,
            name: n.name
        })),
        courseTitle: (course as any).title,
        activePlan: activePlan ? {
            id: activePlan._id.toString(),
            goal: activePlan.goal,
            phase: activePlan.phase,
            schedule: (activePlan.schedule || []).map((t: any) => ({
                id: t._id?.toString(),
                topicName: t.topicName,
                date: t.date.toISOString(),
                status: t.status
            }))
        } : null
    };
}

// Retry analysis for failed resources
export async function retryResourceAnalysis(resourceId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    await dbConnect();

    const resource = await Resource.findOne({
        _id: resourceId,
        userId: session.user.id
    });

    if (!resource) throw new Error('Resource not found');
    if (resource.status === 'ready') return { success: true, message: 'Already analyzed' };

    // Reset to processing immediately
    resource.status = 'processing';
    resource.errorMessage = undefined;
    resource.retryCount = (resource.retryCount || 0) + 1;
    await resource.save();

    revalidatePath(`/dashboard/courses`); // Immediate UI update

    // Trigger Analysis in Background (Fire and Forget)
    (async () => {
        try {
            const { analyzeDocument, analyzeYouTubeVideo } = await import('@/lib/gemini');

            let analysis: any;

            // Check if it's a YouTube video
            if (resource.type === 'video' || resource.documentType === 'video_lecture' || resource.fileUrl.includes('youtube.com') || resource.fileUrl.includes('youtu.be')) {
                console.log(`[Retry] Processing YouTube Video: ${resource.fileUrl}`);
                // Use the YouTube-specific analyzer
                analysis = await analyzeYouTubeVideo(resource.fileUrl);
            } else {
                // Determine mime type
                const mimeTypeMap: Record<string, string> = {
                    'pdf': 'application/pdf',
                    'image': 'image/jpeg',
                    'video': 'video/mp4',
                    'audio': 'audio/mpeg',
                    'slide': 'application/pdf',
                    'note': 'application/pdf',
                    'video_lecture': 'video/mp4' // Validation fix
                };
                const mimeType = mimeTypeMap[resource.type] || 'application/pdf';

                console.log(`[Retry] Processing Document: ${resource.fileUrl} (${mimeType})`);
                analysis = await analyzeDocument(resource.fileUrl, mimeType, resource._id.toString());
            }

            if (analysis) {
                // Atomic Update to avoid VersionError
                const updated = await Resource.findByIdAndUpdate(resource._id, {
                    $set: {
                        knowledgeBase: analysis.distilled_content || analysis.summary,
                        summary: analysis.summary,
                        learningMap: analysis.learning_map,
                        citeKitMap: analysis.citeKitMap,
                        suggestedOrder: analysis.suggested_order,
                        totalConcepts: analysis.total_concepts,
                        documentType: analysis.document_type || resource.documentType,
                        status: 'ready'
                    },
                    $unset: { errorMessage: 1 }
                }, { new: true });
                console.log(`[Retry] Successfully updated resource ${resourceId}`);
            } else {
                await Resource.findByIdAndUpdate(resource._id, {
                    $set: { status: 'error', errorMessage: 'AI analysis returned empty result' }
                });
            }
        } catch (e: any) {
            console.error(`Background Retry Failed for ${resourceId}:`, e);
            const errorMessage = (e.message?.includes('timeout') || e.name === 'AbortError')
                ? 'Analysis timed out (10m limit).'
                : (e?.message || 'Analysis failed');

            await Resource.findByIdAndUpdate(resource._id, {
                $set: { status: 'error', errorMessage }
            });
        }
    })();

    return { success: true, message: 'Analysis started' };
}

// Re-analyze a resource to rebuild its learning map (works on already-analyzed resources)
export async function remapResource(resourceId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    await dbConnect();

    const resource = await Resource.findOne({
        _id: resourceId,
        userId: session.user.id
    });

    if (!resource) throw new Error('Resource not found');
    if (!resource.fileUrl) throw new Error('No file URL found for this resource');

    // Mark as processing temporarily
    resource.status = 'processing';
    await resource.save();

    // Re-analyze in background
    (async () => {
        try {
            const { analyzeDocument, analyzeYouTubeVideo } = await import('@/lib/gemini');

            let analysis: any;

            if (resource.type === 'video' || resource.documentType === 'video_lecture' || resource.fileUrl.includes('youtube.com') || resource.fileUrl.includes('youtu.be')) {
                console.log(`[Remap] Re-analyzing YouTube Video: ${resource.fileUrl}`);
                analysis = await analyzeYouTubeVideo(resource.fileUrl);
            } else {
                const mimeTypeMap: Record<string, string> = {
                    'pdf': 'application/pdf',
                    'image': 'image/jpeg',
                    'video': 'video/mp4',
                    'audio': 'audio/mpeg',
                    'slide': 'application/pdf',
                    'note': 'application/pdf',
                    'video_lecture': 'video/mp4'
                };
                const mimeType = mimeTypeMap[resource.type] || 'application/pdf';

                console.log(`[Remap] Re-analyzing Document: ${resource.fileUrl} (${mimeType})`);
                analysis = await analyzeDocument(resource.fileUrl, mimeType, resource._id.toString());
            }

            if (analysis) {
                await Resource.findByIdAndUpdate(resource._id, {
                    $set: {
                        knowledgeBase: analysis.distilled_content || analysis.summary,
                        summary: analysis.summary,
                        learningMap: analysis.learning_map,
                        citeKitMap: analysis.citeKitMap,
                        suggestedOrder: analysis.suggested_order,
                        totalConcepts: analysis.total_concepts,
                        documentType: analysis.document_type || resource.documentType,
                        status: 'ready'
                    },
                    $unset: { errorMessage: 1 }
                });
                console.log(`[Remap] Successfully re-analyzed resource ${resourceId}`);
            } else {
                await Resource.findByIdAndUpdate(resource._id, {
                    $set: { status: 'ready', errorMessage: 'Re-analysis returned empty result' }
                });
            }
        } catch (e: any) {
            console.error(`[Remap] Failed for ${resourceId}:`, e);
            await Resource.findByIdAndUpdate(resource._id, {
                $set: { status: 'ready', errorMessage: `Remap failed: ${e?.message}` }
            });
        }
    })();

    return { success: true, message: 'Re-analysis started. Page mapping will update shortly.' };
}

// Bulk Retry Action
export async function retryAllFailedResources(courseId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    await dbConnect();

    // Find all failed resources for this course
    const failedResources = await Resource.find({
        courseId,
        userId: session.user.id,
        status: 'error'
    });

    if (failedResources.length === 0) {
        return { success: true, message: 'No failed resources found' };
    }

    // Trigger retry for each
    // We do NOT await the individual background processes here, 
    // but the retryResourceAnalysis function itself is async (the background part is inside it).
    // The loop initiates the processing.
    const results = await Promise.allSettled(
        failedResources.map(resource => retryResourceAnalysis(resource._id.toString()))
    );

    revalidatePath(`/dashboard/courses/${courseId}`);
    return { success: true, count: failedResources.length };
}

export async function addYouTubeResource(courseId: string, folderId: string | null, url: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    await dbConnect();

    // 1. Check for Playlist
    const playlistMatch = url.match(/[?&]list=([^#\&\?]+)/);
    if (playlistMatch) {
        const playlistId = playlistMatch[1];
        await processPlaylist(courseId, folderId, playlistId, session.user.id);
        revalidatePath(`/dashboard/courses/${courseId}`);
        return;
    }

    // 2. Single Video
    const videoIdMatch = url.match(/(?:v=|\/)([\w-]{11})(?:\?|&|\/|$)/);
    if (!videoIdMatch) throw new Error('Invalid YouTube URL');

    // Use the full watch URL for oEmbed
    const watchUrl = `https://www.youtube.com/watch?v=${videoIdMatch[1]}`;
    await createVideoResource(courseId, folderId, watchUrl, session.user.id);

    revalidatePath(`/dashboard/courses/${courseId}`);
}

async function processPlaylist(courseId: string, parentFolderId: string | null, playlistId: string, userId: string) {
    // 1. Fetch Playlist Page to get Title and Video IDs
    // This is a lightweight scrape since we don't have API key.
    // We look for the first 10-15 unique video IDs.

    let playlistTitle = `Playlist ${playlistId}`;
    let videoIds: string[] = [];

    try {
        const res = await fetch(`https://www.youtube.com/playlist?list=${playlistId}`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StuddyBot/1.0)' }
        });
        const html = await res.text();

        // Regex for Title
        const titleMatch = html.match(/<title>(.*?) - YouTube<\/title>/);
        if (titleMatch) playlistTitle = titleMatch[1];

        // Regex for Video IDs in the playlist (simple pattern matching)
        // Look for /watch?v=VIDEO_ID
        const idMatches = html.matchAll(/\/watch\?v=([\w-]{11})/g);
        const uniqueIds = new Set<string>();

        for (const match of idMatches) {
            uniqueIds.add(match[1]);
            if (uniqueIds.size >= 10) break; // Cap at 10 for demo speed
        }
        videoIds = Array.from(uniqueIds);

    } catch (e) {
        console.error("Failed to scrape playlist", e);
        return; // Abort if we can't read it
    }

    if (videoIds.length === 0) return;

    // 2. Create Context Folder
    const newFolder = await Folder.create({
        userId,
        courseId,
        parentId: parentFolderId || null,
        name: playlistTitle,
        color: 'red' // YouTube Red
    });

    // 3. Process Videos in Parallel (batching to be nice)
    // We'll do chunks of 3 to avoid hitting rate limits or timeouts
    for (let i = 0; i < videoIds.length; i += 3) {
        const chunk = videoIds.slice(i, i + 3);
        await Promise.all(chunk.map(id =>
            createVideoResource(courseId, newFolder._id.toString(), `https://www.youtube.com/watch?v=${id}`, userId)
                .catch(err => console.error(`Failed to add video ${id}`, err))
        ));
    }
}

async function createVideoResource(courseId: string, folderId: string | null, url: string, userId: string) {
    console.log("createVideoResource ARGS:", { courseId, folderId, url, userId });
    // Fetch Metadata via oEmbed
    let title = 'YouTube Video';
    let summary = '';

    try {
        // oEmbed is reliable for single public videos
        const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
        const res = await fetch(oEmbedUrl);
        if (res.ok) {
            const data = await res.json();
            title = data.title;
            summary = `Video by ${data.author_name}`;
        } else {
            // Fallback if oEmbed fails (restricted video?)
            // We'll just keep "YouTube Video" or try to parse from URL
            title = `Youtube Video (${url.slice(-11)})`;
        }
    } catch (e) {
        console.error("Failed to fetch YouTube metadata for " + url, e);
    }

    // Initialize fields with default/undefined
    const knowledgeBase = undefined;
    const learningMap: any[] = [];
    const totalConcepts = 0;
    const documentType = 'video_lecture';

    // 1. Create Resource Immediately (Processing State)
    const resource = await Resource.create({
        userId,
        courseId,
        folderId: folderId || null,
        title,
        type: 'video',
        fileUrl: url,
        status: 'processing',  // UI shows spinner
        summary,
        knowledgeBase,
        learningMap,
        totalConcepts,
        documentType,
        createdAt: new Date(),
        retryCount: 0
    });

    // 2. Trigger Gemini Analysis (Background - Fire and Forget)
    (async () => {
        try {
            // AI Analysis (Gemini)
            const { analyzeYouTubeVideo } = await import('@/lib/gemini');
            const analysis = await analyzeYouTubeVideo(url);

            if (analysis) {
                resource.summary = analysis.summary || resource.summary;
                resource.knowledgeBase = analysis.distilled_content || resource.knowledgeBase;
                resource.learningMap = analysis.learning_map || [];
                resource.totalConcepts = analysis.total_concepts || 0;
                resource.documentType = analysis.document_type || resource.documentType;

                resource.status = 'ready';
                resource.errorMessage = undefined;
            } else {
                // Should not happen as we throw now, but handled in catch
                resource.status = 'error';
                resource.errorMessage = "Analysis returned empty";
            }
            await resource.save();

        } catch (e: any) {
            console.error(`Background Analysis Failed for video ${url}:`, e);
            resource.status = 'error';
            // Specific timeout handling
            if (e.message?.includes('timeout') || e.name === 'AbortError') {
                resource.errorMessage = 'Analysis timed out (10m limit). Try a shorter video.';
            } else {
                resource.errorMessage = e?.message || 'Unknown analysis error';
            }
            await resource.save();
        }
    })();
}
