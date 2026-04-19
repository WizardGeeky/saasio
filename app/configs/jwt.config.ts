import jwt, {
    SignOptions,
    TokenExpiredError,
    JsonWebTokenError,
    JwtPayload,
} from "jsonwebtoken";

import { AccountStatus } from "../constants/AccountStatus";
import { decrypt } from "./crypto.config";


const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_ISSUER = process.env.JWT_ISSUER as string;
const JWT_AUDIENCE = process.env.JWT_AUDIENCE as string;
const JWT_API_VERSION = process.env.JWT_API_VERSION as string;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN as SignOptions["expiresIn"];

if (!JWT_SECRET || !JWT_ISSUER || !JWT_AUDIENCE || !JWT_API_VERSION) {
    throw new Error("Missing JWT environment variables");
}

export interface CustomJwtPayload {
    sub: string;
    email: string;
    name: string;
    status: AccountStatus;
    role: string;
    apiVersion: string;
    iss: string;
    aud: string;
}

export interface VerifyResult {
    valid: boolean;
    expired: boolean;
    payload?: CustomJwtPayload;
    error?: string;
}

export const generateToken = (payload: {
    sub: string;
    email: string;
    name: string;
    status: AccountStatus;
    role: string;
}): string => {

    const cleanPayload = {
        email: payload.email,
        name: payload.name,
        status: payload.status,
        role: payload.role,
        apiVersion: JWT_API_VERSION
    };

    const options: SignOptions = {
        expiresIn: JWT_EXPIRES_IN,
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
        subject: payload.sub
    };

    return jwt.sign(cleanPayload, JWT_SECRET, options);
};

export const verifyToken = (token: string): VerifyResult => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET, {
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE,
        }) as CustomJwtPayload;

        return {
            valid: true,
            expired: false,
            payload: decoded,
        };
    } catch (error) {
        if (error instanceof TokenExpiredError) {
            return {
                valid: false,
                expired: true,
                error: "Token expired",
            };
        }

        if (error instanceof JsonWebTokenError) {
            return {
                valid: false,
                expired: false,
                error: "Invalid token",
            };
        }

        return {
            valid: false,
            expired: false,
            error: "Token verification failed",
        };
    }
};

export const decodeToken = (token: string): CustomJwtPayload | null => {
    try {
        return jwt.decode(token) as CustomJwtPayload;
    } catch {
        return null;
    }
};

export const isTokenExpired = (token: string): boolean => {
    try {
        const decoded = jwt.decode(token) as JwtPayload;

        if (!decoded || !decoded.exp) return true;

        const currentTime = Math.floor(Date.now() / 1000);
        return decoded.exp < currentTime;
    } catch {
        return true;
    }
};

export const getClaim = <K extends keyof CustomJwtPayload>(
    token: string,
    key: K,
): CustomJwtPayload[K] | null => {
    const decoded = decodeToken(token);
    return decoded ? decoded[key] : null;
};

export const getEmail = (token: string): string | null => {
    const enc = getClaim(token, "email");
    if (!enc) return null;
    try { return decrypt(enc); } catch { return null; }
};
export const getUserId = (token: string) => getClaim(token, "sub");
export const getStatus = (token: string) => getClaim(token, "status");
export const getRole = (token: string) => getClaim(token, "role");
