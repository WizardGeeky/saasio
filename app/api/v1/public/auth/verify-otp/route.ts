import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/configs/database.config";
import { encrypt } from "@/app/configs/crypto.config";
import { generateToken } from "@/app/configs/jwt.config";
import { Otp } from "@/models/Otp";
import { User } from "@/models/User";

export async function POST(req: NextRequest): Promise<NextResponse> {
    try {
        await connectDB();

        const { email, otp } = await req.json();

        if (!email || !otp) {
            return NextResponse.json({ message: "Email and OTP are required" }, { status: 400 });
        }

        // Encrypt both for DB lookup
        const encryptedEmail = encrypt(email);
        const encryptedOtp = encrypt(otp);

        // Find OTP record (encrypted email is the _id)
        const record = await Otp.findById(encryptedEmail);

        if (!record) {
            return NextResponse.json({ message: "OTP not found or already used" }, { status: 400 });
        }

        // Check expiry
        if (new Date() > record.expiresAt) {
            await Otp.findByIdAndDelete(encryptedEmail);
            return NextResponse.json({ message: "OTP has expired. Please request a new one." }, { status: 400 });
        }

        // Verify OTP
        if (record.otp !== encryptedOtp) {
            return NextResponse.json({ message: "Invalid OTP. Please try again." }, { status: 400 });
        }

        // Consume OTP — delete after successful verification
        await Otp.findByIdAndDelete(encryptedEmail);

        // Fetch user for JWT payload
        const user = await User.findOne({ email: encryptedEmail });

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        // Generate JWT — store the encrypted email (same format as DB) for privacy
        const token = generateToken({
            sub: user._id.toString(),
            email: user.email,
            name: user.fullname,
            status: user.accountStatus,
            role: user.role,
        });

        return NextResponse.json(
            { message: "Login successful", token },
            { status: 200 }
        );
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
