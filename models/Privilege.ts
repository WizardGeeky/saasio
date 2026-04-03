import mongoose, { Schema, Model } from "mongoose";

export interface IPrivilege {
  apiPath: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  createdAt: Date;
  updatedAt: Date;
}

const PrivilegeSchema = new Schema<IPrivilege>(
  {
    apiPath: {
      type: String,
      required: true,
    },
    method: {
      type: String,
      required: true,
      enum: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      uppercase: true,
    },
  },
  { timestamps: true }
);

PrivilegeSchema.index({ apiPath: 1, method: 1 }, { unique: true });

export const Privilege: Model<IPrivilege> =
  mongoose.models.Privilege ||
  mongoose.model<IPrivilege>("Privilege", PrivilegeSchema);