import mongoose, { Schema, Document, Model } from "mongoose";

export type SubscriptionStatus = "ACTIVE" | "CANCELLED" | "EXPIRED";

export interface ISubscription extends Document {
    userId: string;
    userEmail: string;
    userName: string;
    projectId: string;
    projectName: string;
    planName: string;
    planPrice: number;      // in rupees
    currency: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    status: SubscriptionStatus;
    createdAt: Date;
    updatedAt: Date;
}

const SubscriptionSchema: Schema<ISubscription> = new Schema(
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
        },
        projectId: {
            type: String,
            required: true,
            index: true,
        },
        projectName: {
            type: String,
            required: true,
        },
        planName: {
            type: String,
            required: true,
        },
        planPrice: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            required: true,
            default: "INR",
        },
        razorpayOrderId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        razorpayPaymentId: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["ACTIVE", "CANCELLED", "EXPIRED"],
            default: "ACTIVE",
        },
    },
    { timestamps: true }
);

const Subscription: Model<ISubscription> =
    mongoose.models.Subscription ||
    mongoose.model<ISubscription>("Subscription", SubscriptionSchema);

export default Subscription;
