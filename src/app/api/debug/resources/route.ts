import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Resource from '@/models/Resource';

export async function GET() {
    try {
        await dbConnect();
        const resources = await Resource.find({}).sort({ createdAt: -1 });

        const debugData = resources.map(r => ({
            id: r._id.toString(),
            title: r.title,
            courseId: r.courseId.toString(),
            folderId: r.folderId ? r.folderId.toString() : 'NULL_OR_UNDEFINED',
            rawFolderId: r.folderId,
            userId: r.userId.toString()
        }));

        return NextResponse.json({
            count: resources.length,
            resources: debugData
        });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
