import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { businesses, profiles } from "@/lib/db/schema";
import { getRequestSession } from "@/lib/auth/get-session";

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [business] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.id, session.businessId))
    .limit(1);

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  // Count workers
  const allProfiles = await db
    .select({ id: profiles.id, role: profiles.role, isActive: profiles.isActive })
    .from(profiles)
    .where(eq(profiles.businessId, session.businessId));

  const totalWorkers = allProfiles.filter((p) => p.role === "worker").length;
  const activeWorkers = allProfiles.filter(
    (p) => p.role === "worker" && p.isActive
  ).length;

  return NextResponse.json({
    id: business.id,
    name: business.name,
    createdAt: business.createdAt,
    totalWorkers,
    activeWorkers,
  });
}
