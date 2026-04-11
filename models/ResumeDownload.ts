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
    },
    { timestamps: true }
);

ResumeDownloadSchema.index({ userId: 1, createdAt: -1 });

const ResumeDownload: Model<IResumeDownload> =
    mongoose.models.ResumeDownload ||
    mongoose.model<IResumeDownload>("ResumeDownload", ResumeDownloadSchema);

export default ResumeDownload;
