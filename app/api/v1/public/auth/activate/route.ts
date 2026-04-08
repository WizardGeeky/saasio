import { NextRequest, NextResponse } from "next/server";
import { User } from "@/models/User";
import { connectDB } from "@/app/configs/database.config";
import { decrypt, encrypt } from "@/app/configs/crypto.config";
import { AccountStatus } from "@/app/constants/AccountStatus";

export async function GET(req: NextRequest): Promise<NextResponse> {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const token = searchParams.get("token");

        if (!token) {
            return NextResponse.json({ message: "Token is required" }, { status: 400 });
        }

        let email;
        try {
            // Decrypt the token to get the email
            email = decrypt(token);
        } catch (error) {
            return NextResponse.json({ message: "Invalid or expired activation link" }, { status: 400 });
        }

        // The email in the token is plain text. We need to find the user with the encrypted email.
        const encryptedEmail = encrypt(email);
        const user = await User.findOne({ email: encryptedEmail });

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        if (user.accountStatus === AccountStatus.ACTIVE) {
            // Already active, just redirect to login
            return NextResponse.redirect(new URL("/login?activated=true", req.url));
        }

        // Activate user
        user.accountStatus = AccountStatus.ACTIVE;
        await user.save();

        // Redirect to login with success message
        return NextResponse.redirect(new URL("/login?activated=true", req.url));

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
