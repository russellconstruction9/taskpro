import { SignJWT, jwtVerify } from "jose";

export interface WorkerSession {
  profileId: number;
  businessId: number;
  role: "worker";
  fullName: string;
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-dev-secret-change-me"
);

/**
 * Create a signed JWT for a worker session.
 * Expires after 8 hours (one shift).
 */
export async function createWorkerToken(
  payload: WorkerSession
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(JWT_SECRET);
}

/**
 * Verify and decode a worker JWT.
 * Returns null if invalid or expired.
 */
export async function verifyWorkerToken(
  token: string
): Promise<WorkerSession | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as WorkerSession;
  } catch {
    return null;
  }
}
