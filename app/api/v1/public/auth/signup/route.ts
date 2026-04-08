import { NextRequest, NextResponse } from "next/server";
import { User } from "@/models/User";
import { Role } from "@/models/Role";
import { connectDB } from "@/app/configs/database.config";
import { encrypt } from "@/app/configs/crypto.config";
import { AccountStatus } from "@/app/constants/AccountStatus";
import { sendActivationEmail } from "@/app/notifications/activation.notification";

export async function POST(req: NextRequest): Promise<NextResponse> {
    try {
        await connectDB();

        const body = await req.json();
        const { email, fullname, mobile, occupation, state, country, source } = body;

        if (!email || !fullname || !mobile) {
            return NextResponse.json({ message: "Required fields are missing" }, { status: 400 });
        }

        // Check if role 'USER' exists
        const userRole = await Role.findById("USER");
        if (!userRole) {
            return NextResponse.json({ message: "Site is still in development. Role 'USER' not found." }, { status: 503 });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [
                { email: encrypt(email) },
                { mobile: encrypt(mobile) }
            ]
        });

        if (existingUser) {
            return NextResponse.json({ message: "User with this email or mobile already exists" }, { status: 409 });
        }

        // Create new user
        const newUser = new User({
            fullname, // Should probably be encrypted too? Checking User.ts... 
            email: encrypt(email),
            mobile: encrypt(mobile),
            occupation,
            state,
            country,
            source,
            role: "USER",
            accountStatus: AccountStatus.INACTIVE
        });

        // The name and other fields should also follow encryption/decryption if required.
        // Looking at User.ts, only email and mobile were used with encrypt() in login/route.ts.
        // Actually, if I encrypt email, I should encrypt mobile too for consistency.

        await newUser.save();

        // Send activation email
        const token = encodeURIComponent(encrypt(email));
        const origin = req.nextUrl.origin;
        const activationUrl = `${origin}/api/v1/public/auth/activate?token=${token}`;

        await sendActivationEmail({
            to: email,
            fullname,
            activationUrl
        });

        return NextResponse.json({ message: "Account created. Please check your email for activation link." }, { status: 201 });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
