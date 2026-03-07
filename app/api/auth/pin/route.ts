import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { profiles } from "@/lib/db/schema";
import { verifyPin } from "@/lib/auth/pin";
import { createWorkerToken, verifyWorkerToken } from "@/lib/auth/session";
import { pinLoginSchema } from "@/lib/validators/schemas";

/**
 * GET /api/auth/pin
 * Returns the current worker session info from the worker-token cookie.
 */
export async function GET(request: NextRequest) {
  const token = request.cookies.get("worker-token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const session = await verifyWorkerToken(token);
  if (!session) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }
  return NextResponse.json({
    profileId: session.profileId,
    businessId: session.businessId,
    fullName: session.fullName,
    role: session.role,
  });
}

/**
 * POST /api/auth/pin
 * Worker PIN authentication.
 * Receives { businessId, pin }, returns JWT cookie.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = pinLoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { businessId, pin } = parsed.data;

    // Get all active workers for this business
    const workers = await db
      .select()
      .from(profiles)
      .where(
        and(
          eq(profiles.businessId, businessId),
          eq(profiles.role, "worker"),
          eq(profiles.isActive, true)
        )
      );

    // Check PIN against each worker (bcrypt compare)
    let matchedWorker = null;
    for (const worker of workers) {
      if (worker.pinHash && (await verifyPin(pin, worker.pinHash))) {
        matchedWorker = worker;
        break;
      }
    }

    if (!matchedWorker) {
      return NextResponse.json(
        { error: "Invalid PIN" },
        { status: 401 }
      );
    }

    // Create JWT token for worker session
    const token = await createWorkerToken({
      profileId: matchedWorker.id,
      businessId: matchedWorker.businessId,
      role: "worker",
      fullName: matchedWorker.fullName,
    });

    // Set as httpOnly cookie (8-hour expiry = one shift)
    const response = NextResponse.json({
      success: true,
      worker: {
        id: matchedWorker.id,
        fullName: matchedWorker.fullName,
        businessId: matchedWorker.businessId,
      },
    });

    response.cookies.set("worker-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60, // 8 hours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("PIN auth error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
