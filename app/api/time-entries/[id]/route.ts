import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { timeEntries } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getRequestSession } from "@/lib/auth/get-session";

/**
 * PATCH /api/time-entries/[id]
 * Clock out — sets clock_out = now().
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRequestSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const entryId = parseInt(id, 10);
  if (isNaN(entryId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  // Verify ownership
  const [entry] = await db
    .select()
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.id, entryId),
        eq(timeEntries.businessId, session.businessId)
      )
    )
    .limit(1);

  if (!entry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (entry.clockOut) {
    return NextResponse.json(
      { error: "Already clocked out" },
      { status: 409 }
    );
  }

  // Workers can only clock out their own entries
  if (session.role === "worker" && entry.profileId !== session.profileId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [updated] = await db
    .update(timeEntries)
    .set({ clockOut: new Date() })
    .where(eq(timeEntries.id, entryId))
    .returning();

  return NextResponse.json(updated);
}
