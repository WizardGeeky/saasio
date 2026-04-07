import mongoose, { Schema, Document, Model } from "mongoose";

export type ComplaintStatus = "PENDING" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";

export interface IComplaint extends Document {
    userId: string;
    userName: string;
    userEmail: string;
    reason: string;
    description: string;
    status: ComplaintStatus;
    adminNotes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ComplaintSchema: Schema<IComplaint> = new Schema(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },
        userName: {
            type: String,
            required: true,
        },
        userEmail: {
            type: String,
            required: true,
            index: true,
        },
        reason: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["PENDING", "IN_PROGRESS", "RESOLVED", "REJECTED"],
            default: "PENDING",
            index: true,
        },
        adminNotes: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

const Complaint: Model<IComplaint> =
    mongoose.models.Complaint ||
    mongoose.model<IComplaint>("Complaint", ComplaintSchema);

export default Complaint;
