import crypto from "crypto";

const DEFAULT_SECRET = "dev-admin-secret";
const secret = process.env.ADMIN_JWT_SECRET || DEFAULT_SECRET;

function b64url(input: Buffer | string) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function hmac(data: string) {
  return crypto.createHmac("sha256", secret).update(data).digest();
}

export type AdminTokenPayload = {
  sub: "admin";
  iat: number; // issued at (epoch seconds)
  exp: number; // expiry (epoch seconds)
};

export function signAdminToken(ttlSeconds = 60 * 60 * 24 * 7): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: AdminTokenPayload = {
    sub: "admin",
    iat: now,
    exp: now + ttlSeconds,
  };
  const payloadJson = JSON.stringify(payload);
  const payloadB64 = b64url(payloadJson);
  const sig = b64url(hmac(payloadB64));
  return `${payloadB64}.${sig}`;
}

export function verifyAdminToken(token: string): { valid: boolean; payload?: AdminTokenPayload } {
  try {
    if (!token || typeof token !== "string") return { valid: false };
    const [payloadB64, sig] = token.split(".");
    if (!payloadB64 || !sig) return { valid: false };
    const expectedSig = b64url(hmac(payloadB64));
    if (expectedSig !== sig) return { valid: false };
    const json = Buffer.from(payloadB64.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    const payload = JSON.parse(json) as AdminTokenPayload;
    if (payload.sub !== "admin") return { valid: false };
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== "number" || payload.exp <= now) return { valid: false };
    return { valid: true, payload };
  } catch {
    return { valid: false };
  }
}
