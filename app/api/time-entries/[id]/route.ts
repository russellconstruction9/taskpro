import { NextRequest, NextResponse } from "next/server";
import { db, withRLS } from "@/lib/db/client";
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

  const [updated] = await withRLS(
    session.businessId,
    session.profileId,
    async (tx) => {
      // Verify ownership within the same transaction
      const [entry] = await tx
        .select()
        .from(timeEntries)
        .where(
          and(
            eq(timeEntries.id, entryId),
            eq(timeEntries.businessId, session.businessId)
          )
        )
        .limit(1);

      if (!entry) return [];
      if (entry.clockOut) return [{ alreadyClocked: true }];
      if (session.role === "worker" && entry.profileId !== session.profileId) return [];

      return tx
        .update(timeEntries)
        .set({ clockOut: new Date() })
        .where(eq(timeEntries.id, entryId))
        .returning();
    }
  );

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if ((updated as any).alreadyClocked) {
    return NextResponse.json({ error: "Already clocked out" }, { status: 409 });
  }

  return NextResponse.json(updated);
}
