import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/configs/database.config";
import { withAuth } from "@/app/utils/withAuth";
import { encrypt, decrypt } from "@/app/configs/crypto.config";
import { AiModel } from "@/models/AiModel";
import { CustomJwtPayload } from "@/app/configs/jwt.config";

function decryptKey(model: any) {
    const obj = model.toObject();
    try {
        obj.apiKey = decrypt(obj.apiKey);
    } catch {
        // Fallback if decryption fails (e.g. if key was already plain text or invalid)
    }
    return obj;
}

/**
 * GET /api/v1/private/ai-models
 * Returns all AI model configs with masked API keys.
 */
export const GET = withAuth(async (
    _req: NextRequest,
    _ctx: { params: any },
    _user: CustomJwtPayload
): Promise<NextResponse> => {
    try {
        await connectDB();
        const models = await AiModel.find().sort({ createdAt: -1 });
        return NextResponse.json({ models: models.map(decryptKey) }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
});

/**
 * POST /api/v1/private/ai-models
 * Creates a new AI model configuration.
 * Body: { provider, modelName, displayName, apiKey, baseUrl?, temperature?, maxTokens?, description?, isActive? }
 */
export const POST = withAuth(async (
    req: NextRequest,
    _ctx: { params: any },
    _user: CustomJwtPayload
): Promise<NextResponse> => {
    try {
        await connectDB();

        const body = await req.json();
        const { provider, modelName, displayName, apiKey, baseUrl, description, isActive } = body;

        if (!provider || !modelName || !displayName || !apiKey) {
            return NextResponse.json(
                { message: "provider, modelName, displayName and apiKey are required" },
                { status: 400 }
            );
        }

        // If setting this as active, deactivate all others
        if (isActive) {
            await AiModel.updateMany({}, { $set: { isActive: false } });
        }

        const model = await AiModel.create({
            provider,
            modelName: modelName.trim(),
            displayName: displayName.trim(),
            apiKey: encrypt(apiKey),
            baseUrl: baseUrl?.trim() || undefined,
            description: description?.trim() || undefined,
            isActive: isActive ?? false,
        });

        return NextResponse.json(
            { message: "AI model created successfully", model: decryptKey(model) },
            { status: 201 }
        );
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
});

/**
 * PUT /api/v1/private/ai-models
 * Updates an AI model configuration.
 * Body: { id, ...fields }
 */
export const PUT = withAuth(async (
    req: NextRequest,
    _ctx: { params: any },
    _user: CustomJwtPayload
): Promise<NextResponse> => {
    try {
        await connectDB();

        const body = await req.json();
        const { id, provider, modelName, displayName, apiKey, baseUrl, description, isActive } = body;

        if (!id) {
            return NextResponse.json({ message: "Model ID is required" }, { status: 400 });
        }

        const existing = await AiModel.findById(id);
        if (!existing) {
            return NextResponse.json({ message: "AI model not found" }, { status: 404 });
        }

        // If activating this model, deactivate all others first
        if (isActive === true) {
            await AiModel.updateMany({ _id: { $ne: id } }, { $set: { isActive: false } });
        }

        const updates: Record<string, any> = {};
        if (provider) updates.provider = provider;
        if (modelName) updates.modelName = modelName.trim();
        if (displayName) updates.displayName = displayName.trim();
        if (apiKey) updates.apiKey = encrypt(apiKey);
        if (baseUrl !== undefined) updates.baseUrl = baseUrl?.trim() || undefined;
        if (description !== undefined) updates.description = description?.trim() || undefined;
        if (isActive !== undefined) updates.isActive = isActive;

        await AiModel.updateOne({ _id: id }, { $set: updates });
        const updated = await AiModel.findById(id);

        return NextResponse.json(
            { message: "AI model updated successfully", model: decryptKey(updated!) },
            { status: 200 }
        );
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
});

/**
 * DELETE /api/v1/private/ai-models
 * Deletes an AI model by ID.
 * Query: ?id=MODEL_ID
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
            return NextResponse.json({ message: "Model ID is required" }, { status: 400 });
        }

        const model = await AiModel.findById(id);
        if (!model) {
            return NextResponse.json({ message: "AI model not found" }, { status: 404 });
        }

        await AiModel.deleteOne({ _id: id });

        return NextResponse.json({ message: "AI model deleted successfully" }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
});
