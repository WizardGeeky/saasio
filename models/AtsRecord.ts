import mongoose, { Document, Model, Schema } from "mongoose";

export interface IAtsReport {
    score: number;
    matchedKeywords: string[];
    missingKeywords: string[];
    sectionScores: {
        skills: number;
        experience: number;
        projects: number;
        education: number;
    };
    suggestions: string[];
}

export interface IAtsRecord extends Document {
    userId: mongoose.Types.ObjectId;
    userEmail: string; // stored encrypted
    jobRoleName: string;
    jobDescription: string;
    resumeText: string;
    structuredData: any; // Result from Gemini extraction
    analysis: IAtsReport;
    modelId: mongoose.Types.ObjectId; // AI model used
    fileName: string;
    createdAt: Date;
    updatedAt: Date;
}

const AtsRecordSchema = new Schema<IAtsRecord>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        userEmail: { type: String, required: true },
        jobRoleName: { type: String, trim: true, default: "" },
        jobDescription: { type: String, required: true },
        resumeText: { type: String, required: true },
        structuredData: { type: Schema.Types.Mixed, required: true },
        analysis: {
            score: { type: Number, required: true },
            matchedKeywords: [{ type: String }],
            missingKeywords: [{ type: String }],
            sectionScores: {
                skills: { type: Number, default: 0 },
                experience: { type: Number, default: 0 },
                projects: { type: Number, default: 0 },
                education: { type: Number, default: 0 },
            },
            suggestions: [{ type: String }],
        },
        modelId: { type: Schema.Types.ObjectId, ref: "AiModel", required: true },
        fileName: { type: String, required: true },
    },
    { timestamps: true }
);

export const AtsRecord: Model<IAtsRecord> =
    mongoose.models.AtsRecord || mongoose.model<IAtsRecord>("AtsRecord", AtsRecordSchema);
