import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/configs/database.config";
import { encrypt, decrypt } from "@/app/configs/crypto.config";
import RazorpayConfig from "@/models/Rozarpay";
import { withAuth } from "@/app/utils/withAuth";

/**
 * GET /api/v1/private/rozarpay
 * Fetches the currently active Razorpay configuration.
 */
export const GET = withAuth(async (req: NextRequest): Promise<NextResponse> => {
    try {
        await connectDB();
        const config = await RazorpayConfig.findOne({ isActive: true });
        
        if (!config) {
            return NextResponse.json(
                { success: false, message: "No active configuration found" },
                { status: 404 }
            );
        }

        // Decrypt keys for the frontend if needed, but usually we just show masks or let them edit.
        // For security, we might not want to send the actual secrets back unless necessary.
        // But for a config screen, we might need them or just send them encrypted.
        // Here we send them decrypted so the user can see/edit them.
        const data = {
            _id: config._id,
            keyId: decrypt(config.keyId),
            keySecret: "********", // Don't send the real secret back for security, just a placeholder
            webhookSecret: config.webhookSecret ? "********" : undefined,
            environment: config.environment,
            isActive: config.isActive,
            createdAt: config.createdAt,
            updatedAt: config.updatedAt,
        };

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
});

/**
 * POST /api/v1/private/rozarpay
 * Creates a new Razorpay configuration and marks it as active.
 */
export const POST = withAuth(async (req: NextRequest): Promise<NextResponse> => {
    try {
        await connectDB();
        const body = await req.json();
        const { keyId, keySecret, webhookSecret, environment } = body;

        if (!keyId || !keySecret) {
            return NextResponse.json(
                { success: false, message: "KeyId and KeySecret are required" },
                { status: 400 }
            );
        }

        // Deactivate all existing configs
        await RazorpayConfig.updateMany({}, { isActive: false });

        const config = await RazorpayConfig.create({
            keyId: encrypt(keyId),
            keySecret: encrypt(keySecret),
            webhookSecret: webhookSecret ? encrypt(webhookSecret) : undefined,
            environment: environment,
            isActive: true,
        });

        return NextResponse.json({
            success: true,
            message: "Razorpay config saved successfully",
            data: config,
        }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
});

/**
 * PUT /api/v1/private/rozarpay
 * Updates an existing Razorpay configuration.
 */
export const PUT = withAuth(async (req: NextRequest): Promise<NextResponse> => {
    try {
        await connectDB();
        const body = await req.json();
        const { id, keyId, keySecret, webhookSecret, environment, isActive } = body;

        if (!id) {
            return NextResponse.json({ success: false, message: "Config ID is required" }, { status: 400 });
        }

        const updateData: any = {};
        if (keyId) updateData.keyId = encrypt(keyId);
        if (keySecret && keySecret !== "********") updateData.keySecret = encrypt(keySecret);
        if (webhookSecret && webhookSecret !== "********") updateData.webhookSecret = encrypt(webhookSecret);
        if (environment) updateData.environment = environment;
        if (typeof isActive !== 'undefined') updateData.isActive = isActive;

        const config = await RazorpayConfig.findByIdAndUpdate(id, updateData, { new: true });

        if (!config) {
            return NextResponse.json({ success: false, message: "Configuration not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: "Razorpay config updated successfully",
            data: config,
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
});

/**
 * DELETE /api/v1/private/rozarpay
 * Deletes a Razorpay configuration.
 */
export const DELETE = withAuth(async (req: NextRequest): Promise<NextResponse> => {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ success: false, message: "Config ID is required" }, { status: 400 });
        }

        const config = await RazorpayConfig.findByIdAndDelete(id);

        if (!config) {
            return NextResponse.json({ success: false, message: "Configuration not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: "Razorpay config deleted successfully",
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
});
