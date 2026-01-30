'use server';

import { auth } from '@/auth';
import dbConnect from './db';
import Course from '@/models/Course';
import Folder from '@/models/Folder';
import Resource from '@/models/Resource';
import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';

// --- Types ---
export interface CourseData {
    id: string;
    title: string;
    description?: string;
    color: string;
    resourceCount?: number;
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

    return courses.map((c: any) => ({
        id: c._id.toString(),
        title: c.title,
        description: c.description,
        color: c.color,
    }));
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
    if (!session?.user?.id) return { folders: [], resources: [], navigation: [] };

    await dbConnect();

    // Verify Course
    const course = await Course.findOne({ _id: courseId, userId: session.user.id }).lean();
    if (!course) throw new Error('Course not found');

    // Fetch Folders in this level
    const folders = await Folder.find({
        courseId,
        userId: session.user.id,
        parentId: folderId || null
    }).sort({ name: 1 }).lean();

    // Fetch Resources in this level
    const resources = await Resource.find({
        courseId,
        userId: session.user.id,
        folderId: folderId || null // Crucial: match null parent for root resources
    }).sort({ createdAt: -1 }).lean();

    // Build Breadcrumbs (Navigation)
    let navigation = [];
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

    return {
        folders: folders.map((f: any) => ({ id: f._id.toString(), name: f.name, parentId: f.parentId?.toString() })),
        resources: resources.map((r: any) => ({
            id: r._id.toString(),
            title: r.title,
            type: r.type,
            fileUrl: r.fileUrl,
            status: r.status
        })),
        navigation,
        courseTitle: (course as any).title
    };
}
