import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const SECRET_KEY = process.env.AES_SECRET_KEY!;

if (!SECRET_KEY || SECRET_KEY.length !== 32) {
    throw new Error("AES_SECRET_KEY must be 32 characters long");
}

function getDeterministicIV(text: string): Buffer {
    return crypto
        .createHash("sha256")
        .update(text)
        .digest()
        .subarray(0, 16);
}

// Encrypt (Deterministic)
export function encrypt(text: string): string {
    const iv = getDeterministicIV(text);

    const cipher = crypto.createCipheriv(
        ALGORITHM,
        Buffer.from(SECRET_KEY),
        iv
    );

    const encrypted = Buffer.concat([
        cipher.update(text, "utf8"),
        cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return [
        iv.toString("hex"),
        authTag.toString("hex"),
        encrypted.toString("hex"),
    ].join(":");
}

// Decrypt
export function decrypt(encryptedText: string): string {
    const [ivHex, authTagHex, encryptedHex] = encryptedText.split(":");

    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const encryptedData = Buffer.from(encryptedHex, "hex");

    const decipher = crypto.createDecipheriv(
        ALGORITHM,
        Buffer.from(SECRET_KEY),
        iv
    );

    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
        decipher.update(encryptedData),
        decipher.final(),
    ]);

    return decrypted.toString("utf8");
}