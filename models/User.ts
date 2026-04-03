import mongoose, { Document, Model, Schema } from "mongoose";
import { AccountStatus } from "@/app/constants/AccountStatus";

export interface IUser extends Document {
  fullname: string;
  mobile: string;
  email: string;
  occupation: string;
  state: string;
  country: string;
  source: string;
  accountStatus: AccountStatus;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    fullname: {
      type: String,
      required: true,
      trim: true,
    },

    mobile: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    accountStatus: {
      type: String,
      enum: Object.values(AccountStatus),
      default: AccountStatus.INACTIVE,
      index: true,
    },

    role: {
      type: String,
      ref: "Role",
      required: true,
      trim: true,
      index: true,
    },

    occupation: {
      type: String,
      required: true,
      trim: true,
    },

    state: {
      type: String,
      required: true,
      trim: true,
    },

    country: {
      type: String,
      required: true,
      trim: true,
    },

    source: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ email: 1, mobile: 1 });

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);