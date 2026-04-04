import { NextRequest, NextResponse } from "next/server";
import { User } from "@/models/User";
import { connectDB } from "@/app/configs/database.config";
import { encrypt, decrypt } from "@/app/configs/crypto.config";
import { AccountStatus } from "@/app/constants/AccountStatus";
import { sendOTP } from "@/app/notifications/otp.notification";
import type { LoginRequest } from "@/app/types/login.type";

export async function POST(req: NextRequest): Promise<NextResponse> {
    try {
        await connectDB();

        const body: LoginRequest = await req.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json({ message: "Email is required" }, { status: 400 });
        }

        const user = await User.findOne({ email: encrypt(email) });

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        if (user.accountStatus === AccountStatus.INACTIVE) {
            return NextResponse.json({ message: "Your account is inactive. Please contact support." }, { status: 403 });
        }

        if (user.accountStatus === AccountStatus.SUSPENDED) {
            return NextResponse.json({ message: "Your account is suspended. Please contact support." }, { status: 403 });
        }
        const plainEmail = decrypt(user.email);
        await sendOTP(plainEmail);

        return NextResponse.json({ message: "OTP sent to your registered email" }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
