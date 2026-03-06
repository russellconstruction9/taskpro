import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { taskPhotos } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getRequestSession } from "@/lib/auth/get-session";

/**
 * GET /api/photos/[id]
 * Serve a photo with correct Content-Type and aggressive caching.
 * Photos are immutable — cache forever.
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
  const photoId = parseInt(id, 10);
  if (isNaN(photoId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const [photo] = await db
    .select()
    .from(taskPhotos)
    .where(
      and(
        eq(taskPhotos.id, photoId),
        eq(taskPhotos.businessId, session.businessId)
      )
    )
    .limit(1);

  if (!photo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(photo.photoData, {
    status: 200,
    headers: {
      "Content-Type": photo.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Length": photo.fileSizeBytes?.toString() || "",
    },
  });
}
