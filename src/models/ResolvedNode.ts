import mongoose, { Schema, Model } from "mongoose";

export interface IResolvedNode {
    resourceId: mongoose.Types.ObjectId;
    nodeId: string;
    url: string; // UploadThing or S3 URL
    mimeType: string;
    createdAt: Date;
    metadata?: Record<string, any>; // For extra info like page range, resolution hash, etc.
}

const ResolvedNodeSchema = new Schema<IResolvedNode>(
    {
        resourceId: { type: Schema.Types.ObjectId, ref: "Resource", required: true },
        nodeId: { type: String, required: true },
        url: { type: String, required: true },
        mimeType: { type: String, required: true },
        metadata: { type: Schema.Types.Mixed },
    },
    {
        timestamps: true,
    }
);

// Compound index for fast lookup
ResolvedNodeSchema.index({ resourceId: 1, nodeId: 1 }, { unique: true });

export const ResolvedNode: Model<IResolvedNode> =
    mongoose.models.ResolvedNode || mongoose.model("ResolvedNode", ResolvedNodeSchema);
