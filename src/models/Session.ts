import mongoose from 'mongoose';

const SessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    studyPlanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudyPlan',
        required: true
    },
    title: {
        type: String,
        required: true,
        default: "Untitled Session"
    },
    topicName: {
        type: String,
        required: true
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: Date,
    status: {
        type: String,
        enum: ['active', 'completed', 'abandoned'],
        default: 'active'
    },
    // The "Transcript" tracks the interaction in the workspace
    // This is separate from the main chat history, as it's specific to this work session
    transcript: [{
        role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
        content: String,
        widgetType: { type: String, enum: ['text', 'quiz', 'flashcard', 'explanation'], default: 'text' },
        widgetData: mongoose.Schema.Types.Mixed,
        timestamp: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

export default mongoose.models.Session || mongoose.model('Session', SessionSchema);
