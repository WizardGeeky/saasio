import mongoose, { Schema, Document, Model } from "mongoose";

export type ReviewStatus = "PUBLISHED" | "PENDING" | "HIDDEN";

export interface IReview extends Document {
    userId: string;
    userName: string;
    userEmail: string;
    rating: number;
    title?: string;
    body?: string;
    resumeDownloadId?: string;
    resumeName?: string;
    templateName?: string;
    status: ReviewStatus;
    createdAt: Date;
    updatedAt: Date;
}

const ReviewSchema: Schema<IReview> = new Schema(
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
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        title: {
            type: String,
        },
        body: {
            type: String,
        },
        resumeDownloadId: {
            type: String,
        },
        resumeName: {
            type: String,
        },
        templateName: {
            type: String,
        },
        status: {
            type: String,
            enum: ["PUBLISHED", "PENDING", "HIDDEN"],
            default: "PUBLISHED",
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

const Review: Model<IReview> =
    mongoose.models.Review ||
    mongoose.model<IReview>("Review", ReviewSchema);

export default Review;
