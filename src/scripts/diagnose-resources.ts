
import dbConnect from '../lib/db';
import Resource from '../models/Resource';
import User from '../models/User';
import mongoose from 'mongoose';

async function diagnose() {
    try {
        await dbConnect();
        console.log("Connected to DB.");

        // Fetch all resources
        const resources = await Resource.find({}).sort({ createdAt: -1 });

        console.log(`Found ${resources.length} total resources.`);

        resources.forEach(r => {
            console.log("------------------------------------------------");
            console.log(`Title: ${r.title}`);
            console.log(`ID: ${r._id}`);
            console.log(`CourseId: ${r.courseId}`);
            console.log(`FolderId: ${r.folderId} (Type: ${typeof r.folderId})`);
            console.log(`Raw FolderId:`, r.get('folderId'));
            console.log(`CreatedAt: ${r.createdAt}`);
        });

        if (resources.length === 0) {
            console.log("No resources found. This might be why nothing shows up!");
        }

        process.exit(0);
    } catch (error) {
        console.error("Diagnosis failed:", error);
        process.exit(1);
    }
}

diagnose();
