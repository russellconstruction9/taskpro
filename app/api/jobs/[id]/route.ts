import { NextRequest, NextResponse } from "next/server";
import { db, withRLS } from "@/lib/db/client";
import { jobs } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { updateJobSchema } from "@/lib/validators/schemas";
import { getRequestSession } from "@/lib/auth/get-session";

/**
 * GET /api/jobs/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRequestSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const jobId = parseInt(id, 10);

  const [job] = await withRLS(session.businessId, session.profileId, (tx) =>
    tx
      .select()
      .from(jobs)
      .where(and(eq(jobs.id, jobId), eq(jobs.businessId, session.businessId)))
      .limit(1)
  );

  if (!job) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(job);
}

/**
 * PATCH /api/jobs/[id]
 * Admin only.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRequestSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const jobId = parseInt(id, 10);
  const body = await request.json();
  const parsed = updateJobSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const [updated] = await withRLS(session.businessId, session.profileId, (tx) =>
    tx
      .update(jobs)
      .set(parsed.data)
      .where(and(eq(jobs.id, jobId), eq(jobs.businessId, session.businessId)))
      .returning()
  );

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

/**
 * DELETE /api/jobs/[id]
 * Admin only.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRequestSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const jobId = parseInt(id, 10);

  const [deleted] = await withRLS(session.businessId, session.profileId, (tx) =>
    tx
      .delete(jobs)
      .where(and(eq(jobs.id, jobId), eq(jobs.businessId, session.businessId)))
      .returning()
  );

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
