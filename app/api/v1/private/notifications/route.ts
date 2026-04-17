import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/configs/database.config";
import { withAuth } from "@/app/utils/withAuth";
import { decrypt } from "@/app/configs/crypto.config";
import { User } from "@/models/User";
import { sendEmail } from "@/app/notifications/email.notification";
import { CustomJwtPayload } from "@/app/configs/jwt.config";
import { AccountStatus } from "@/app/constants/AccountStatus";

/**
 * POST /api/v1/private/notifications
 * Sends an email to a target group of users.
 *
 * Body: {
 *   subject: string,
 *   html: string,
 *   target: "ALL" | "ROLE",
 *   roleId?: string   // required when target === "ROLE"
 * }
 */
export const POST = withAuth(async (
    req: NextRequest,
    _ctx: { params: any },
    _user: CustomJwtPayload
): Promise<NextResponse> => {
    try {
        await connectDB();

        const body = await req.json();
        const { subject, html, target, roleId, statusFilter = "ACTIVE" } = body;

        if (!subject?.trim()) {
            return NextResponse.json({ message: "Subject is required" }, { status: 400 });
        }
        if (!html?.trim()) {
            return NextResponse.json({ message: "Email body is required" }, { status: 400 });
        }
        if (!target || !["ALL", "ROLE"].includes(target)) {
            return NextResponse.json({ message: "target must be ALL or ROLE" }, { status: 400 });
        }
        if (target === "ROLE" && !roleId?.trim()) {
            return NextResponse.json({ message: "roleId is required when target is ROLE" }, { status: 400 });
        }
        if (target === "ALL" && !["ACTIVE", "INACTIVE", "SUSPENDED", "ALL"].includes(statusFilter)) {
            return NextResponse.json({ message: "statusFilter must be ACTIVE, INACTIVE, SUSPENDED, or ALL" }, { status: 400 });
        }

        // Build query based on target and statusFilter
        const query: Record<string, any> = {};
        if (target === "ROLE") {
            query.accountStatus = AccountStatus.ACTIVE;
            query.role = roleId;
        } else if (statusFilter !== "ALL") {
            query.accountStatus = statusFilter as AccountStatus;
        }

        const users = await User.find(query).select("email fullname").lean();

        if (users.length === 0) {
            return NextResponse.json(
                { message: "No active users found for the selected target" },
                { status: 404 }
            );
        }

        // Decrypt emails and send
        const results = await Promise.allSettled(
            users.map(async (u) => {
                const email = decrypt(u.email);
                await sendEmail({ to: email, subject, html });
                return email;
            })
        );

        const sent = results.filter((r) => r.status === "fulfilled").length;
        const failed = results.filter((r) => r.status === "rejected").length;

        return NextResponse.json(
            {
                message: `Email sent to ${sent} user${sent !== 1 ? "s" : ""}${failed > 0 ? `, ${failed} failed` : ""}`,
                sent,
                failed,
                total: users.length,
            },
            { status: 200 }
        );
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
});

/**
 * GET /api/v1/private/notifications
 * Returns recipient preview count for a given target.
 * Query: ?target=ALL or ?target=ROLE&roleId=ROLE_ID
 */
export const GET = withAuth(async (
    req: NextRequest,
    _ctx: { params: any },
    _user: CustomJwtPayload
): Promise<NextResponse> => {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const target = searchParams.get("target") ?? "ALL";
        const roleId = searchParams.get("roleId");
        const statusFilter = searchParams.get("statusFilter") ?? "ACTIVE";

        const query: Record<string, any> = {};
        if (target === "ROLE") {
            query.accountStatus = AccountStatus.ACTIVE;
            if (roleId) query.role = roleId;
        } else if (statusFilter !== "ALL") {
            query.accountStatus = statusFilter as AccountStatus;
        }

        const count = await User.countDocuments(query);

        return NextResponse.json({ count }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
});
