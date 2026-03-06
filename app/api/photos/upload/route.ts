import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { taskPhotos } from "@/lib/db/schema";
import { getRequestSession } from "@/lib/auth/get-session";
import { uploadPhotoSchema } from "@/lib/validators/schemas";

const MAX_PHOTO_SIZE = 2 * 1024 * 1024; // 2MB

/**
 * POST /api/photos/upload
 * Upload a proof-of-work photo as bytea.
 * Expects multipart/form-data with fields: taskId, caption (optional), photo (file).
 */
export async function POST(request: NextRequest) {
  const session = await getRequestSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const taskId = formData.get("taskId") as string;
  const caption = formData.get("caption") as string | null;
  const photo = formData.get("photo") as File | null;

  // Validate metadata
  const parsed = uploadPhotoSchema.safeParse({ taskId, caption });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (!photo || !(photo instanceof File)) {
    return NextResponse.json(
      { error: "Photo file is required" },
      { status: 400 }
    );
  }

  // Validate file type
  if (!photo.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "File must be an image" },
      { status: 400 }
    );
  }

  // Validate file size
  if (photo.size > MAX_PHOTO_SIZE) {
    return NextResponse.json(
      { error: `Photo must be under ${MAX_PHOTO_SIZE / 1024 / 1024}MB` },
      { status: 400 }
    );
  }

  // Read file as Buffer for bytea storage
  const arrayBuffer = await photo.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const [photoRecord] = await db
    .insert(taskPhotos)
    .values({
      businessId: session.businessId,
      taskId: parsed.data.taskId,
      uploadedBy: session.profileId,
      photoData: buffer,
      mimeType: photo.type,
      fileSizeBytes: photo.size,
      caption: parsed.data.caption,
    })
    .returning({
      id: taskPhotos.id,
      taskId: taskPhotos.taskId,
      mimeType: taskPhotos.mimeType,
      fileSizeBytes: taskPhotos.fileSizeBytes,
      caption: taskPhotos.caption,
      createdAt: taskPhotos.createdAt,
    });

  return NextResponse.json(photoRecord, { status: 201 });
}
