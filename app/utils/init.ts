import seed from "../scripts/seed";

let isInitialized = false;
export default async function initApp() {
    if (isInitialized) return;
    console.log("🚀 Initializing app...");
    await seed();
    isInitialized = true;
}