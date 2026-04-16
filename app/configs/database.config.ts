import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI in .env.local");
}

type MongooseCache = {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
};

declare global {
    var _mongooseCache: MongooseCache | undefined;
}

// Always reference the SAME global object so concurrent requests
// share the in-progress promise instead of each creating a new one.
if (!globalThis._mongooseCache) {
    globalThis._mongooseCache = { conn: null, promise: null };
}
const cached = globalThis._mongooseCache;

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
