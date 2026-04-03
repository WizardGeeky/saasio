import { connectDB } from "../configs/database.config";
import syncPrivileges from "./syncPrivileges";
import syncRoles from "./syncRoles";
import syncUsers from "./syncUsers";

export default async function seed() {
    try {
        console.log("🚀 Starting full seed process...");
        await connectDB();
        await syncPrivileges();
        await syncRoles();
        await syncUsers();
        console.log("🎉 Full seed completed successfully");
    } catch (error) {
        console.error("🔥 Script failed:", error);
    }
}
