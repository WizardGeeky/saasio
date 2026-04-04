import mongoose, { Schema, Model } from "mongoose";

export interface IOtp {
  _id: string; // encrypted email as primary key
  otp: string; // encrypted OTP code
  expiresAt: Date;
}

const OtpSchema = new Schema<IOtp>(
  {
    _id: {
      type: String,
      required: true,
    },
    otp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL: auto-delete when expiresAt is past
    },
  },
  { timestamps: false }
);

export const Otp: Model<IOtp> =
  mongoose.models.Otp || mongoose.model<IOtp>("Otp", OtpSchema);
