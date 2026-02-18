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
        required: false  // Changed: Optional for Quick Study sessions
    },
    studyPlanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudyPlan',
        required: false  // Changed: Optional for Quick Study sessions
    },
    
    // Quick Study metadata
    initialQuery: {
        type: String,
        required: false  // User's initial question in Quick Study
    },
    startedVia: {
        type: String,
        enum: ['regular', 'quick_study'],
        default: 'regular'
    },
    
    // Session roadmap (can be generated during session)
    roadmap: {
        objective: String,  // "Master supply curve concepts"
        milestones: [String],  // ["Understand definition", "Learn applications"]
        completedMilestones: [String],
        generatedAt: Date
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
        enum: ['active', 'completed', 'abandoned', 'in_progress'],  // Added 'in_progress'
        default: 'active'
    },
    currentResourceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resource'
    },

    // --- Sticky Grounding (Visual Context) ---
    activeGroundingUrl: { type: String }, // The UploadThing URL of the currently "pinned" node
    activeGroundingNodeId: { type: String }, // The Node ID derived from CiteKit

    // --- Agentic Core (Anchor & Drift) ---
    milestones: [{
        label: { type: String, required: true },
        status: { type: String, enum: ['pending', 'active', 'completed'], default: 'pending' },
        reasoning: String // Why this step matters
    }],

    parkingLot: [{
        item: String,  // Simplified: just the item text
        topic: String,  // Legacy field
        question: String,  // Legacy field
        context: String, // e.g. "Page 5"
        addedAt: { type: Date, default: Date.now },
        resolved: { type: Boolean, default: false }  // Track if addressed
    }],

    mood: {
        userEngagement: { type: String, enum: ['high', 'low', 'neutral'], default: 'neutral' },
        agentMode: { type: String, enum: ['guide', 'challenger', 'supporter'], default: 'guide' }
    },

    highlights: [{
        id: String,
        text: String,
        pageIndex: Number,
        rects: [{
            x: Number,
            y: Number,
            width: Number,
            height: Number
        }],
        color: { type: String, default: 'yellow' },
        note: String,
        createdAt: { type: Date, default: Date.now }
    }],
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
        toolResults: [mongoose.Schema.Types.Mixed], // Store processed results for UI
        suggestedActions: [{
            label: String,
            intent: String,
            priority: { type: String, enum: ['primary', 'secondary'] }
        }]
    }],
    progress: {
        conceptsCovered: [String],       // Concepts the companion has covered with user
        estimatedTotal: { type: Number, default: 5 },  // Estimated concepts for this topic (set by companion)
        quizzesTaken: { type: Number, default: 0 },
        quizzesCorrect: { type: Number, default: 0 },
        isComplete: { type: Boolean, default: false }  // Marked complete by user or companion
    }
}, { timestamps: true });

export default mongoose.models.Session || mongoose.model('Session', SessionSchema);
