import mongoose, { Schema, Document } from 'mongoose';

export interface IAuthToken extends Document {
    userId: mongoose.Types.ObjectId;
    type: 'verify_email' | 'reset_password';
    tokenHash: string;
    expiresAt: Date;
    usedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const AuthTokenSchema = new Schema<IAuthToken>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        type: { type: String, enum: ['verify_email', 'reset_password'], required: true, index: true },
        tokenHash: { type: String, required: true, unique: true },
        expiresAt: { type: Date, required: true, index: true },
        usedAt: { type: Date }
    },
    { timestamps: true }
);

export default mongoose.models.AuthToken || mongoose.model<IAuthToken>('AuthToken', AuthTokenSchema);
