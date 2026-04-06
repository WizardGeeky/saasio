import mongoose, { Schema, Document, Model } from "mongoose";

export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED";

export interface IPaymentOrder extends Document {
    razorpayOrderId: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    userId: string;
    userEmail: string;
    userName: string;
    amount: number;        // in paise (₹1 = 100 paise)
    currency: string;
    status: PaymentStatus;
    description?: string;
    notes?: Record<string, string>;
    createdAt: Date;
    updatedAt: Date;
}

const PaymentOrderSchema: Schema<IPaymentOrder> = new Schema(
    {
        razorpayOrderId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        razorpayPaymentId: {
            type: String,
            index: true,
        },
        razorpaySignature: {
            type: String,
        },
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
        amount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            required: true,
            default: "INR",
        },
        status: {
            type: String,
            enum: ["PENDING", "SUCCESS", "FAILED"],
            default: "PENDING",
        },
        description: {
            type: String,
        },
        notes: {
            type: Map,
            of: String,
        },
    },
    {
        timestamps: true,
    }
);

const PaymentOrder: Model<IPaymentOrder> =
    mongoose.models.PaymentOrder ||
    mongoose.model<IPaymentOrder>("PaymentOrder", PaymentOrderSchema);

export default PaymentOrder;
