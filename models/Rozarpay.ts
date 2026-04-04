import mongoose, { Schema, Document, Model } from "mongoose";
import { RozarPayEnv } from "@/app/constants/RozarPayEnv";
export interface IRazorpayConfig extends Document {
    keyId: string;
    keySecret: string;
    webhookSecret?: string;
    isActive: boolean;
    environment: RozarPayEnv;
    createdAt: Date;
    updatedAt: Date;
}

const RazorpayConfigSchema: Schema<IRazorpayConfig> = new Schema(
    {
        keyId: {
            type: String,
            required: true,
            trim: true,
        },
        keySecret: {
            type: String,
            required: true,
        },
        webhookSecret: {
            type: String,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        environment: {
            type: String,
            enum: Object.values(RozarPayEnv),
            default: RozarPayEnv.TEST,
        },
    },
    {
        timestamps: true,
    }
);

const RazorpayConfig: Model<IRazorpayConfig> =
    mongoose.models.RazorpayConfig ||
    mongoose.model<IRazorpayConfig>("RazorpayConfig", RazorpayConfigSchema);

export default RazorpayConfig;