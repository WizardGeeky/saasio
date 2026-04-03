import mongoose, { Schema, Model } from "mongoose";

export interface IRole {
  _id: string;
  privileges: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema = new Schema<IRole>(
  {
    _id: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    privileges: [
      {
        type: Schema.Types.ObjectId,
        ref: "Privilege",
        required: true,
      },
    ],
  },
  { timestamps: true }
);

export const Role: Model<IRole> =
  mongoose.models.Role || mongoose.model<IRole>("Role", RoleSchema);