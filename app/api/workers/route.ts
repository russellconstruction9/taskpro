import { NextRequest, NextResponse } from "next/server";
import { db, withRLS } from "@/lib/db/client";
import { profiles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createProfileSchema } from "@/lib/validators/schemas";
import { hashPassword, hashPin } from "@/lib/auth/pin";
import { getRequestSession } from "@/lib/auth/get-session";

/**
 * GET /api/workers
 * List all workers for the current business. Admin only.
 */
export async function GET(request: NextRequest) {
  const session = await getRequestSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const workers = await withRLS(session.businessId, session.profileId, (tx) =>
    tx
      .select({
        id: profiles.id,
        fullName: profiles.fullName,
        role: profiles.role,
        email: profiles.email,
        hourlyRate: profiles.hourlyRate,
        isActive: profiles.isActive,
        createdAt: profiles.createdAt,
      })
      .from(profiles)
      .where(
        and(
          eq(profiles.businessId, session.businessId),
          eq(profiles.role, "worker")
        )
      )
      .orderBy(profiles.fullName)
  );

  return NextResponse.json(workers);
}

/**
 * POST /api/workers
 * Create a new worker profile. Admin only.
 */
export async function POST(request: NextRequest) {
  const session = await getRequestSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createProfileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { fullName, role, email, password, pin, hourlyRate } = parsed.data;

  // Hash credentials
  const passwordHash = password ? await hashPassword(password) : null;
  const pinHash = pin ? await hashPin(pin) : null;

  const [profile] = await withRLS(session.businessId, session.profileId, (tx) =>
    tx
      .insert(profiles)
      .values({
        businessId: session.businessId,
        fullName,
        role,
        email,
        passwordHash,
        pinHash,
        hourlyRate: hourlyRate.toFixed(2),
      })
      .returning({
        id: profiles.id,
        fullName: profiles.fullName,
        role: profiles.role,
        email: profiles.email,
        hourlyRate: profiles.hourlyRate,
        isActive: profiles.isActive,
        createdAt: profiles.createdAt,
      })
  );

  return NextResponse.json(profile, { status: 201 });
}
