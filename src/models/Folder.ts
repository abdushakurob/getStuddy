import mongoose, { Schema, Document } from 'mongoose';

export interface IFolder extends Document {
    name: string;
    courseId: mongoose.Types.ObjectId;
    parentId?: mongoose.Types.ObjectId; // If null, it's a root folder (or we just use courseId)
    userId: mongoose.Types.ObjectId;
    createdAt: Date;
}

const FolderSchema = new Schema<IFolder>({
    name: { type: String, required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Folder', default: null },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export default mongoose.models.Folder || mongoose.model<IFolder>('Folder', FolderSchema);
