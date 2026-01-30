import mongoose, { Schema, Document } from 'mongoose';

export interface IResource extends Document {
    courseId: mongoose.Types.ObjectId;
    folderId?: mongoose.Types.ObjectId; // Optional: if null, it's in root
    userId: mongoose.Types.ObjectId;

    title: string;
    type: 'pdf' | 'slide' | 'note';
    fileUrl: string; // The UploadThing public URL

    // The Intel (AI Context)
    extractedText: string; // Full text content
    summary?: string;      // AI generated summary
    vectorId?: string;     // If we use a vector DB later

    status: 'processing' | 'ready' | 'error';
    createdAt: Date;
}

const ResourceSchema = new Schema<IResource>({
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    folderId: { type: Schema.Types.ObjectId, ref: 'Folder' },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    title: { type: String, required: true },
    type: { type: String, enum: ['pdf', 'slide', 'note'], default: 'pdf' },
    fileUrl: { type: String, required: true },

    extractedText: { type: String }, // Can be large
    summary: { type: String },

    status: { type: String, enum: ['processing', 'ready', 'error'], default: 'processing' },
}, { timestamps: true });

export default mongoose.models.Resource || mongoose.model<IResource>('Resource', ResourceSchema);
