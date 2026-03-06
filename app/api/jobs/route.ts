import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { jobs } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createJobSchema } from "@/lib/validators/schemas";
import { getRequestSession } from "@/lib/auth/get-session";

/**
 * GET /api/jobs
 * List all jobs for the current business.
 */
export async function GET(request: NextRequest) {
  const session = await getRequestSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const conditions = [eq(jobs.businessId, session.businessId)];
  if (status) {
    conditions.push(eq(jobs.status, status));
  }

  const result = await db
    .select()
    .from(jobs)
    .where(and(...conditions))
    .orderBy(jobs.createdAt);

  return NextResponse.json(result);
}

/**
 * POST /api/jobs
 * Create a new job. Admin only.
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
  const parsed = createJobSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const [job] = await db
    .insert(jobs)
    .values({
      businessId: session.businessId,
      ...parsed.data,
    })
    .returning();

  return NextResponse.json(job, { status: 201 });
}
