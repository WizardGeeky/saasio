import { connectDB } from "../configs/database.config";
import syncPrivileges from "./syncPrivileges";
import syncRoles from "./syncRoles";
import syncUsers from "./syncUsers";
import { Privilege } from "@/models/Privilege";
import { Role } from "@/models/Role";

export default async function seed() {
    try {
        console.log("🚀 Starting full seed process...");
        await connectDB();

        // ⚠️ Clear privileges and roles only once during ID type migration
        // Note: You might want to remove this after a successful migration if preserving manual changes
        console.log("🧹 Clearing existing privileges and roles for fresh sync...");
        await Privilege.deleteMany({});
        // await Role.deleteMany({});

        await syncPrivileges();
        await syncRoles();
        await syncUsers();
        console.log("🎉 Full seed completed successfully");
    } catch (error) {
        console.error("🔥 Script failed:", error);
    }
}
