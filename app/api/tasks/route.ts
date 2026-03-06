import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { tasks, taskPhotos, profiles } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { createTaskSchema } from "@/lib/validators/schemas";
import { getRequestSession } from "@/lib/auth/get-session";

/**
 * GET /api/tasks
 * List tasks with optional filters: ?jobId=&status=&assignedTo=
 */
export async function GET(request: NextRequest) {
  const session = await getRequestSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");
  const status = searchParams.get("status");
  const assignedTo = searchParams.get("assignedTo");

  const conditions = [eq(tasks.businessId, session.businessId)];

  if (jobId) conditions.push(eq(tasks.jobId, parseInt(jobId, 10)));
  if (status) conditions.push(eq(tasks.status, status));

  // Workers only see their own tasks
  if (session.role === "worker") {
    conditions.push(eq(tasks.assignedTo, session.profileId));
  } else if (assignedTo) {
    conditions.push(eq(tasks.assignedTo, parseInt(assignedTo, 10)));
  }

  const result = await db
    .select({
      id: tasks.id,
      businessId: tasks.businessId,
      jobId: tasks.jobId,
      assignedTo: tasks.assignedTo,
      title: tasks.title,
      description: tasks.description,
      status: tasks.status,
      requiresPhoto: tasks.requiresPhoto,
      createdAt: tasks.createdAt,
      completedAt: tasks.completedAt,
      assigneeName: profiles.fullName,
      photoCount: sql<number>`(SELECT count(*) FROM task_photos WHERE task_photos.task_id = ${tasks.id})`,
    })
    .from(tasks)
    .leftJoin(profiles, eq(tasks.assignedTo, profiles.id))
    .where(and(...conditions))
    .orderBy(tasks.createdAt);

  return NextResponse.json(result);
}

/**
 * POST /api/tasks
 * Create a new task. Admin only.
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
  const parsed = createTaskSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const [task] = await db
    .insert(tasks)
    .values({
      businessId: session.businessId,
      jobId: parsed.data.jobId,
      title: parsed.data.title,
      description: parsed.data.description,
      assignedTo: parsed.data.assignedTo,
      requiresPhoto: parsed.data.requiresPhoto,
    })
    .returning();

  return NextResponse.json(task, { status: 201 });
}
