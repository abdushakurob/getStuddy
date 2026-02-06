import mongoose, { Schema, Document } from 'mongoose';

// Structured concept with location
interface IConcept {
    name: string;
    location: string; // "Page 5", "Section 2.1", "0:45"
    prerequisites: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    keyPoints: string[];
}

interface ILearningTopic {
    topic: string;
    concepts: IConcept[];
}

export interface IResource extends Document {
    courseId: mongoose.Types.ObjectId;
    folderId?: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;

    title: string;
    type: 'pdf' | 'slide' | 'note' | 'image' | 'audio' | 'video';
    fileUrl: string;

    // The Intel (AI Context)
    knowledgeBase: string;
    summary?: string;

    // Structured learning data
    learningMap?: ILearningTopic[];
    suggestedOrder?: string[];
    totalConcepts?: number;
    documentType?: 'educational' | 'technical' | 'literary' | 'research' | 'reference' | 'academic_planning' | 'business' | 'other';

    status: 'processing' | 'ready' | 'error';
    errorMessage?: string;
    retryCount: number;
    createdAt: Date;
}

const ConceptSchema = new Schema({
    name: String,
    location: String,
    prerequisites: [String],
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
    keyPoints: [String]
}, { _id: false });

const LearningTopicSchema = new Schema({
    topic: String,
    concepts: [ConceptSchema]
}, { _id: false });

const ResourceSchema = new Schema<IResource>({
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    folderId: { type: Schema.Types.ObjectId, ref: 'Folder' },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    title: { type: String, required: true },
    type: { type: String, enum: ['pdf', 'slide', 'note', 'exam_paper', 'syllabus', 'image', 'audio', 'video'], default: 'pdf' },
    fileUrl: { type: String, required: true },

    knowledgeBase: { type: String },
    summary: { type: String },

    // Structured learning data
    learningMap: [LearningTopicSchema],
    suggestedOrder: [String],
    totalConcepts: Number,
    documentType: { type: String, enum: ['educational', 'technical', 'literary', 'research', 'reference', 'academic_planning', 'business', 'other'] },

    status: { type: String, enum: ['processing', 'ready', 'error'], default: 'processing' },
    errorMessage: { type: String },
    retryCount: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.Resource || mongoose.model<IResource>('Resource', ResourceSchema);