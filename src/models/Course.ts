import mongoose, { Schema, Document } from 'mongoose';

export interface ICourse extends Document {
    userId: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    color?: string; // For UI customization
    rootFolderId?: mongoose.Types.ObjectId; // The top-level folder for this course
    createdAt: Date;
}

const CourseSchema = new Schema<ICourse>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String },
    color: { type: String, default: '#00F2D3' }, // Default Brand Teal
    rootFolderId: { type: Schema.Types.ObjectId, ref: 'Folder' },
}, { timestamps: true });

export default mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);
