import mongoose, { Document, Model, Schema } from "mongoose";

export type AiProvider = "openai" | "anthropic" | "google" | "mistral" | "groq" | "custom";

export interface IAiModel extends Document {
    provider: AiProvider;
    modelName: string;
    displayName: string;
    apiKey: string;      // stored encrypted
    baseUrl?: string;
    isActive: boolean;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

const AiModelSchema = new Schema<IAiModel>(
    {
        provider: {
            type: String,
            required: true,
            enum: ["openai", "anthropic", "google", "mistral", "groq", "custom"],
        },
        modelName: { type: String, required: true, trim: true },
        displayName: { type: String, required: true, trim: true },
        apiKey: { type: String, required: true },
        baseUrl: { type: String, trim: true },
        isActive: { type: Boolean, default: false, index: true },
        description: { type: String, trim: true },
    },
    { timestamps: true }
);

export const AiModel: Model<IAiModel> =
    mongoose.models.AiModel || mongoose.model<IAiModel>("AiModel", AiModelSchema);
