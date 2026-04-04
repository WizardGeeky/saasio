import fs from "fs";
import path from "path";
import { connectDB } from "../configs/database.config";
import { Privilege } from "@/models/Privilege";

const API_BASE_PATH = path.join(process.cwd(), "app/api/v1/private");

function getRouteFiles(dir: string, files: string[] = []) {
    if (!fs.existsSync(dir)) {
        return files;
    }

    for (const file of fs.readdirSync(dir)) {
        const fullPath = path.join(dir, file);

        if (fs.statSync(fullPath).isDirectory()) {
            getRouteFiles(fullPath, files);
        } else if (file === "route.ts" || file === "route.js") {
            files.push(fullPath);
        }
    }
    return files;
}

function getApiPath(filePath: string): string {
    return filePath
        .split("app")[1]
        ?.replace(/\\/g, "/")
        .replace("/route.ts", "")
        .replace("/route.js", "") || "";
}

function getMethods(filePath: string): string[] {
    const content = fs.readFileSync(filePath, "utf-8");
    const methods = ["GET", "POST", "PUT", "DELETE", "PATCH"];
    return methods.filter((m) => {
        // Detect:
        // 1. export async function GET
        // 2. export const GET =
        const regex = new RegExp(`export\\s+(async\\s+function|const)\\s+${m}\\b`, 'g');
        return regex.test(content);
    });
}

function generateName(apiPath: string, method: string): string {
    const segments = apiPath.split("/").filter(Boolean);
    const resource = segments[segments.length - 1] || "resource";
    const formatted = resource
        .replace(/[\[\]]/g, "")
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    return `${method} ${formatted}`;
}

export default async function syncPrivileges() {
    try {
        await connectDB();
        console.log("🔐 Syncing privileges from route files...");

        const files = getRouteFiles(API_BASE_PATH);

        for (const file of files) {
            const apiPath = getApiPath(file);
            if (!apiPath) continue;

            const methods = getMethods(file);
            if (methods.length === 0) continue;

            for (const method of methods) {
                const name = generateName(apiPath, method);
                const privilegeId = `${method}:${apiPath}`;

                try {
                    await Privilege.updateOne(
                        { _id: privilegeId },
                        {
                            $set: { _id: privilegeId, name, apiPath, method },
                        },
                        { upsert: true }
                    );

                    console.log(`✅ Synced privilege: [${method}] ${apiPath}`);
                } catch (err: any) {
                    console.error(`❌ Error syncing [${method}] ${apiPath}:`, err.message);
                }
            }
        }

        console.log("🎉 Privilege sync completed");
    } catch (error: any) {
        console.error("🔥 Privilege sync failed:", error.message);
    }
}