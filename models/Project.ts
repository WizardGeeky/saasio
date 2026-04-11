import mongoose, { Schema, Model } from "mongoose";

export type ProjectStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export interface IPaymentPlan {
    name: string;
    price: number;
    currency: string;
    descriptions: string[];
    /** Max number of feature uses included in this plan. 0 = unlimited. */
    maxUsage: number;
}

export interface IProject {
    _id: string;
    name: string;
    status: ProjectStatus;
    plans: IPaymentPlan[];
    createdAt: Date;
    updatedAt: Date;
}

const PaymentPlanSchema = new Schema<IPaymentPlan>(
    {
        name:         { type: String, required: true, trim: true },
        price:        { type: Number, required: true, min: 0 },
        currency:     { type: String, required: true, trim: true, default: "INR" },
        descriptions: [{ type: String, trim: true }],
        maxUsage:     { type: Number, default: 0, min: 0 },
    },
    { _id: false }
);

const ProjectSchema = new Schema<IProject>(
    {
        _id:    { type: String, required: true, uppercase: true, trim: true },
        name:   { type: String, required: true, trim: true },
        status: { type: String, enum: ["ACTIVE", "INACTIVE", "SUSPENDED"], default: "INACTIVE" },
        plans:  { type: [PaymentPlanSchema], validate: [(v: any[]) => v.length === 3, "A project must have exactly 3 payment plans"] },
    },
    { timestamps: true }
);

export const Project: Model<IProject> =
    mongoose.models.Project || mongoose.model<IProject>("Project", ProjectSchema);
