import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { timeEntries, profiles } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { clockInSchema } from "@/lib/validators/schemas";
import { getRequestSession } from "@/lib/auth/get-session";

/**
 * GET /api/time-entries
 * List time entries. If ?active=true, returns only the active (open) clock-in.
 */
export async function GET(request: NextRequest) {
  const session = await getRequestSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const activeOnly = searchParams.get("active") === "true";
  const profileFilter = searchParams.get("profileId");

  const conditions = [eq(timeEntries.businessId, session.businessId)];

  if (activeOnly) {
    conditions.push(isNull(timeEntries.clockOut));
  }

  if (profileFilter) {
    conditions.push(eq(timeEntries.profileId, parseInt(profileFilter, 10)));
  } else if (session.role === "worker") {
    // Workers can only see their own entries
    conditions.push(eq(timeEntries.profileId, session.profileId));
  }

  const entries = await db
    .select({
      id: timeEntries.id,
      businessId: timeEntries.businessId,
      profileId: timeEntries.profileId,
      taskId: timeEntries.taskId,
      clockIn: timeEntries.clockIn,
      clockOut: timeEntries.clockOut,
      workerName: profiles.fullName,
      hourlyRate: profiles.hourlyRate,
    })
    .from(timeEntries)
    .leftJoin(profiles, eq(timeEntries.profileId, profiles.id))
    .where(and(...conditions))
    .orderBy(timeEntries.clockIn);

  return NextResponse.json(entries);
}

/**
 * POST /api/time-entries
 * Clock in — creates a new time entry with clock_out = NULL.
 */
export async function POST(request: NextRequest) {
  const session = await getRequestSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = clockInSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Check if worker already has an active clock-in
  const [existing] = await db
    .select()
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.profileId, session.profileId),
        isNull(timeEntries.clockOut)
      )
    )
    .limit(1);

  if (existing) {
    return NextResponse.json(
      { error: "Already clocked in. Clock out first.", activeEntry: existing },
      { status: 409 }
    );
  }

  const [entry] = await db
    .insert(timeEntries)
    .values({
      businessId: session.businessId,
      profileId: session.profileId,
      taskId: parsed.data.taskId ?? null,
    })
    .returning();

  return NextResponse.json(entry, { status: 201 });
}
