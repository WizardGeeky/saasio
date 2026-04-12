import mongoose, { Document, Model, Schema } from "mongoose";

export interface IResumeDownload extends Document {
    userId: string;
    userEmail: string;
    userName: string;
    templateId: string;
    templateName: string;
    fileName: string;
    resumeName: string;
    resumeTitle: string;
    source: string;
    resumePayload?: Record<string, unknown>;
    subscriptionId?: string;
    subscriptionProjectId?: string;
    subscriptionProjectName?: string;
    subscriptionPlanName?: string;
    subscriptionPlanPrice?: number | null;
    subscriptionCurrency?: string;
    subscriptionStatus?: string;
    subscriptionUsageCount?: number | null;
    subscriptionMaxUsage?: number | null;
    subscriptionRemaining?: number | null;
    createdAt: Date;
    updatedAt: Date;
}

const ResumeDownloadSchema = new Schema<IResumeDownload>(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },
        userEmail: {
            type: String,
            required: true,
            index: true,
        },
        userName: {
            type: String,
            required: true,
            default: "",
        },
        templateId: {
            type: String,
            required: true,
            trim: true,
        },
        templateName: {
            type: String,
            required: true,
            trim: true,
        },
        fileName: {
            type: String,
            required: true,
            trim: true,
        },
        resumeName: {
            type: String,
            default: "",
            trim: true,
        },
        resumeTitle: {
            type: String,
            default: "",
            trim: true,
        },
        source: {
            type: String,
            default: "resume-config",
            trim: true,
        },
        resumePayload: {
            type: Schema.Types.Mixed,
            default: undefined,
        },
        subscriptionId: {
            type: String,
            trim: true,
            default: undefined,
            index: true,
        },
        subscriptionProjectId: {
            type: String,
            trim: true,
            default: undefined,
        },
        subscriptionProjectName: {
            type: String,
            trim: true,
            default: undefined,
        },
        subscriptionPlanName: {
            type: String,
            trim: true,
            default: undefined,
        },
        subscriptionPlanPrice: {
            type: Number,
            default: null,
        },
        subscriptionCurrency: {
            type: String,
            trim: true,
            default: undefined,
        },
        subscriptionStatus: {
            type: String,
            trim: true,
            default: undefined,
        },
        subscriptionUsageCount: {
            type: Number,
            default: null,
            min: 0,
        },
        subscriptionMaxUsage: {
            type: Number,
            default: null,
            min: 0,
        },
        subscriptionRemaining: {
            type: Number,
            default: null,
            min: 0,
        },
    },
    { timestamps: true }
);

ResumeDownloadSchema.index({ userId: 1, createdAt: -1 });

const ResumeDownload: Model<IResumeDownload> =
    mongoose.models.ResumeDownload ||
    mongoose.model<IResumeDownload>("ResumeDownload", ResumeDownloadSchema);

export default ResumeDownload;
