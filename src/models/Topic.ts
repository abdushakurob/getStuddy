import mongoose, { Schema, Document } from 'mongoose';

export interface ITopic extends Document {
    courseId: mongoose.Types.ObjectId;
    name: string;
    status: 'locked' | 'unlocked' | 'mastered';
    complexity: 'Low' | 'Medium' | 'High';
    masteryScore: number; // 0 to 100
    createdAt: Date;
}

const TopicSchema = new Schema<ITopic>({
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    name: { type: String, required: true },
    status: { type: String, enum: ['locked', 'unlocked', 'mastered'], default: 'locked' },
    complexity: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    masteryScore: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.Topic || mongoose.model<ITopic>('Topic', TopicSchema);
