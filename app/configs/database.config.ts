import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI in .env.local");
}

// Always reference the SAME global object so concurrent requests
// share the in-progress promise instead of each creating a new one.
if (!(global as any)._mongooseCache) {
    (global as any)._mongooseCache = { conn: null, promise: null };
}
const cached: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } =
    (global as any)._mongooseCache;

export async function connectDB() {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI).then((m) => m);
    }

    try {
        cached.conn = await cached.promise;
    } catch (error) {
        // Reset so the next call retries instead of awaiting a failed promise
        cached.promise = null;
        cached.conn = null;
        throw error;
    }

    return cached.conn;
}