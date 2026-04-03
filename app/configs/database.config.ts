import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI in .env.local");
}

let cached = (global as any).mongoose || { conn: null, promise: null };

export async function connectDB() {
    try {
        if (cached.conn) {
            console.log("✅ Using existing MongoDB connection");
            return cached.conn;
        }
        if (!cached.promise) {
            console.log("⏳ Connecting to MongoDB...");

            cached.promise = mongoose.connect(MONGODB_URI, {
                bufferCommands: false,
            })
                .then((mongooseInstance) => {
                    return mongooseInstance;
                })
                .catch((error) => {
                    throw error;
                });
        }

        cached.conn = await cached.promise;
        (global as any).mongoose = cached;

        return cached.conn;

    } catch (error: any) {
        cached.promise = null;
        cached.conn = null;

        throw new Error("Failed to connect to database");
    }
}