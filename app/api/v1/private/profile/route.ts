import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/configs/database.config";
import { withAuth } from "@/app/utils/withAuth";
import { encrypt, decrypt } from "@/app/configs/crypto.config";
import { User } from "@/models/User";
import { CustomJwtPayload } from "@/app/configs/jwt.config";

function decryptProfile(user: any) {
    try {
        return {
            _id: user._id.toString(),
            fullname: user.fullname,
            email: decrypt(user.email),
            mobile: decrypt(user.mobile),
            occupation: user.occupation,
            state: user.state,
            country: user.country,
            source: user.source,
            accountStatus: user.accountStatus,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    } catch {
        return {
            _id: user._id.toString(),
            fullname: user.fullname,
            email: "[encrypted]",
            mobile: "[encrypted]",
            occupation: user.occupation,
            state: user.state,
            country: user.country,
            source: user.source,
            accountStatus: user.accountStatus,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
}

/**
 * GET /api/v1/private/profile
 * Returns the currently authenticated user's own profile.
 */
export const GET = withAuth(async (
    _req: NextRequest,
    _ctx: { params: any },
    user: CustomJwtPayload
): Promise<NextResponse> => {
    try {
        await connectDB();

        // 1. Primary: look up by _id stored in JWT sub
        let profile = await User.findById(user.sub).lean();

        if (!profile && user.email) {
            // Fallback: jwt.email is encrypted (same format as DB)
            try {
                profile = await User.findOne({ email: user.email }).lean();
            } catch { /* ignore */ }
        }

        if (!profile) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ user: decryptProfile(profile) }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
});

/**
 * PUT /api/v1/private/profile
 * Updates the currently authenticated user's own profile.
 * Updatable: fullname, mobile, occupation, state, country, source
 * NOT updatable: email, role, accountStatus (admin-controlled)
 */
export const PUT = withAuth(async (
    req: NextRequest,
    _ctx: { params: any },
    user: CustomJwtPayload
): Promise<NextResponse> => {
    try {
        await connectDB();

        const { fullname, mobile, occupation, state, country, source } = await req.json();

        let existing = await User.findById(user.sub);

        if (!existing && user.email) {
            try { existing = await User.findOne({ email: user.email }); } catch { /* ignore */ }
        }

        if (!existing) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        const updates: Record<string, any> = {};

        if (fullname?.trim()) updates.fullname = fullname.trim();
        if (occupation?.trim()) updates.occupation = occupation.trim();
        if (state?.trim()) updates.state = state.trim();
        if (country?.trim()) updates.country = country.trim();
        if (source?.trim()) updates.source = source.trim();

        if (mobile?.trim()) {
            const encryptedMobile = encrypt(mobile.trim());
            // Check duplicate only if mobile actually changed
            if (encryptedMobile !== existing.mobile) {
                const duplicate = await User.findOne({ mobile: encryptedMobile });
                if (duplicate) {
                    return NextResponse.json({ message: "This mobile number is already in use" }, { status: 409 });
                }
                updates.mobile = encryptedMobile;
            }
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ message: "No changes to save" }, { status: 400 });
        }

        await User.updateOne({ _id: existing._id }, { $set: updates });
        const updated = await User.findById(existing._id).lean();

        return NextResponse.json(
            { message: "Profile updated successfully", user: decryptProfile(updated) },
            { status: 200 }
        );
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
});
