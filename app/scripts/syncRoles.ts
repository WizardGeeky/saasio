import { connectDB } from "../configs/database.config";
import { Role } from "@/models/Role";
import { Privilege } from "@/models/Privilege";


export default async function syncRoles() {
    try {
        await connectDB();
        console.log("🛡 Syncing SYSTEM_ADMIN role...");

        const privileges = await Privilege.find().select("_id");
        const allPrivilegeIds = privileges.map((p) => p._id);

        await Role.updateOne(
            { _id: "SYSTEM_ADMIN" },
            {
                $set: {
                    privileges: allPrivilegeIds,
                },
            },
            { upsert: true }
        );

        console.log("✅ SYSTEM_ADMIN synced with all privileges");
    } catch (error: any) {
        console.error("❌ SYSTEM_ADMIN sync failed:", error.message);
    }
}
