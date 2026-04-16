import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/configs/database.config";
import { withAuth } from "@/app/utils/withAuth";
import { encrypt, decrypt } from "@/app/configs/crypto.config";
import { User } from "@/models/User";
import { CustomJwtPayload } from "@/app/configs/jwt.config";
import { AccountStatus } from "@/app/constants/AccountStatus";
import { sendWelcomeEmail } from "@/app/notifications/welcome.notification";

function getAppUrl(req: NextRequest) {
    const configuredUrl = process.env.NEXT_PUBLIC_APP_URL;
    return (configuredUrl ?? new URL(req.url).origin).replace(/\/$/, "");
}

function decryptUser(user: any) {
    try {
        return {
            _id: user._id,
            fullname: user.fullname,
            email: decrypt(user.email),
            mobile: decrypt(user.mobile),
            occupation: user.occupation,
            state: user.state,
            country: user.country,
            source: user.source,
            accountStatus: user.accountStatus,
            role: typeof user.role === "object" && user.role !== null ? (user.role as any)._id ?? "" : user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    } catch {
        return {
            _id: user._id,
            fullname: user.fullname,
            email: "[encrypted]",
            mobile: "[encrypted]",
            occupation: user.occupation,
            state: user.state,
            country: user.country,
            source: user.source,
            accountStatus: user.accountStatus,
            role: typeof user.role === "object" && user.role !== null ? (user.role as any)._id ?? "" : user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
}

/**
 * GET /api/v1/private/users
 * Returns all users with decrypted email/mobile and populated role.
 */
export const GET = withAuth(async (
    _req: NextRequest,
    _ctx: { params: any },
    _user: CustomJwtPayload
): Promise<NextResponse> => {
    try {
        await connectDB();

        const users = await User.find()
            .sort({ createdAt: -1 })
            .lean();

        const decrypted = users.map(decryptUser);

        return NextResponse.json({ users: decrypted }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
});

/**
 * POST /api/v1/private/users
 * Creates a new user.
 * Body: { fullname, email, mobile, occupation, state, country, source, role, accountStatus? }
 */
export const POST = withAuth(async (
    req: NextRequest,
    _ctx: { params: any },
    _user: CustomJwtPayload
): Promise<NextResponse> => {
    try {
        await connectDB();

        const body = await req.json();
        const { fullname, email, mobile, occupation, state, country, source, role, accountStatus } = body;

        if (!fullname || !email || !mobile || !occupation || !state || !country || !source || !role) {
            return NextResponse.json(
                { message: "All fields (fullname, email, mobile, occupation, state, country, source, role) are required" },
                { status: 400 }
            );
        }

        const encryptedEmail = encrypt(email.toLowerCase().trim());
        const encryptedMobile = encrypt(mobile.trim());

        // Check for existing email/mobile
        const existing = await User.findOne({
            $or: [{ email: encryptedEmail }, { mobile: encryptedMobile }],
        });

        if (existing) {
            const field = existing.email === encryptedEmail ? "email" : "mobile";
            return NextResponse.json(
                { message: `A user with this ${field} already exists` },
                { status: 409 }
            );
        }

        const user = await User.create({
            fullname: fullname.trim(),
            email: encryptedEmail,
            mobile: encryptedMobile,
            occupation: occupation.trim(),
            state: state.trim(),
            country: country.trim(),
            source: source.trim(),
            role,
            accountStatus: accountStatus ?? AccountStatus.INACTIVE,
        });

        // Send welcome email in the background — don't block the response
        const plainEmail = email.toLowerCase().trim();
        const appUrl = getAppUrl(req);
        sendWelcomeEmail({
            to: plainEmail,
            fullname: fullname.trim(),
            role,
            loginUrl: `${appUrl}/login`,
        }).catch((err) => console.error("[welcome-email] failed to send:", err));

        return NextResponse.json(
            { message: "User created successfully", user: decryptUser(user) },
            { status: 201 }
        );
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
});

/**
 * PUT /api/v1/private/users
 * Updates a user's fields.
 * Body: { id, fullname?, occupation?, state?, country?, source?, role?, accountStatus? }
 * Note: email and mobile are not updatable via this endpoint to prevent conflicts.
 */
export const PUT = withAuth(async (
    req: NextRequest,
    _ctx: { params: any },
    _user: CustomJwtPayload
): Promise<NextResponse> => {
    try {
        await connectDB();

        const body = await req.json();
        const { id, fullname, occupation, state, country, source, role, accountStatus } = body;

        if (!id) {
            return NextResponse.json({ message: "User ID is required" }, { status: 400 });
        }

        const user = await User.findById(id);
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        const updates: Record<string, any> = {};
        if (fullname) updates.fullname = fullname.trim();
        if (occupation) updates.occupation = occupation.trim();
        if (state) updates.state = state.trim();
        if (country) updates.country = country.trim();
        if (source) updates.source = source.trim();
        if (role) updates.role = role;
        if (accountStatus) updates.accountStatus = accountStatus;

        await User.updateOne({ _id: id }, { $set: updates });
        const updated = await User.findById(id).lean();

        return NextResponse.json(
            { message: "User updated successfully", user: decryptUser(updated) },
            { status: 200 }
        );
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
});

/**
 * DELETE /api/v1/private/users
 * Deletes a user by ID.
 * Query: ?id=USER_ID
 */
export const DELETE = withAuth(async (
    req: NextRequest,
    _ctx: { params: any },
    _user: CustomJwtPayload
): Promise<NextResponse> => {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ message: "User ID is required" }, { status: 400 });
        }

        // Prevent deleting yourself
        if (id === _user.sub) {
            return NextResponse.json(
                { message: "You cannot delete your own account" },
                { status: 403 }
            );
        }

        const user = await User.findById(id);
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        await User.deleteOne({ _id: id });

        return NextResponse.json({ message: "User deleted successfully" }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
});
