import { connectDB } from "../configs/database.config";
import { encrypt } from "../configs/crypto.config";
import { User } from "@/models/User";

export default async function syncUsers() {
    try {
        await connectDB();
        console.log("👤 Syncing default SYSTEM_ADMIN user...");

        const email = process.env.DEFAULT_ADMIN_EMAIL;

        if (!email) {
            console.warn("⚠️ DEFAULT_ADMIN_EMAIL not defined in .env");
            return;
        }

        const existingUser = await User.findOne({ email: encrypt(email) });

        if (existingUser) {
            console.log("⏭️ Default admin already exists, skipping...");
            return;
        }


        await User.create({
            fullname: process.env.DEFAULT_ADMIN_NAME!,
            mobile: encrypt(process.env.DEFAULT_ADMIN_MOBILE!),
            email: encrypt(process.env.DEFAULT_ADMIN_EMAIL!),
            role: process.env.DEFAULT_ADMIN_ROLE!,
            accountStatus: process.env.DEFAULT_ADMIN_ACCOUNT_STATUS!,
            occupation: process.env.DEFAULT_ADMIN_OCCUPATION!,
            state: process.env.DEFAULT_ADMIN_STATE!,
            country: process.env.DEFAULT_ADMIN_COUNTRY!,
            source: process.env.DEFAULT_ADMIN_SOURCE!,
        });

        console.log("✅ Default SYSTEM_ADMIN user created");
    } catch (error: any) {
        console.error("❌ Default user sync failed:", error.message);
    }
}