import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/config";
import { verifyWorkerToken, type WorkerSession } from "@/lib/auth/session";

export interface UnifiedSession {
  profileId: number;
  businessId: number;
  role: "admin" | "worker";
  fullName: string;
}

/**
 * Get the authenticated session from either NextAuth (admin) or
 * worker JWT cookie. Returns null if not authenticated.
 */
export async function getRequestSession(
  request: NextRequest
): Promise<UnifiedSession | null> {
  // 1. Try NextAuth session (admin)
  const nextAuthSession = await auth();
  if (nextAuthSession?.user) {
    return {
      profileId: parseInt(nextAuthSession.user.id, 10),
      businessId: nextAuthSession.user.businessId,
      role: nextAuthSession.user.role,
      fullName: nextAuthSession.user.fullName,
    };
  }

  // 2. Try worker JWT cookie
  const workerToken = request.cookies.get("worker-token")?.value;
  if (workerToken) {
    const workerSession: WorkerSession | null =
      await verifyWorkerToken(workerToken);
    if (workerSession) {
      return {
        profileId: workerSession.profileId,
        businessId: workerSession.businessId,
        role: workerSession.role,
        fullName: workerSession.fullName,
      };
    }
  }

  return null;
}
