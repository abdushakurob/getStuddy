import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    email: string;
    name: string;
    avatarUrl?: string;
    xp: number;
    credits: number;
    streak: {
        count: number;
        lastActiveDate: Date;
    };
    level: number;
    createdAt: Date;
}

const UserSchema = new Schema<IUser>({
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    avatarUrl: { type: String },

    // Gamification Stats
    xp: { type: Number, default: 0 },
    credits: { type: Number, default: 100 }, // Starting bonus
    streak: {
        count: { type: Number, default: 0 },
        lastActiveDate: { type: Date, default: Date.now },
    },
    level: { type: Number, default: 1 },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
