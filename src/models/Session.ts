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
    currentResourceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resource'
    },
    // The "Transcript" tracks the interaction in the workspace
    transcript: [{
        role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
        content: String,
        widgetType: { type: String, enum: ['text', 'quiz', 'flashcard', 'explanation', 'concept', 'check'], default: 'text' },
        widgetData: mongoose.Schema.Types.Mixed,
        timestamp: { type: Date, default: Date.now },
        toolCalls: [{
            tool: String,
            args: mongoose.Schema.Types.Mixed,
            result: mongoose.Schema.Types.Mixed
        }],
        suggestedActions: [{
            label: String,
            intent: String,
            priority: { type: String, enum: ['primary', 'secondary'] }
        }]
    }],
    progress: {
        conceptsCovered: [String],
        quizzesTaken: { type: Number, default: 0 },
        quizzesCorrect: { type: Number, default: 0 }
    }
}, { timestamps: true });

export default mongoose.models.Session || mongoose.model('Session', SessionSchema);
