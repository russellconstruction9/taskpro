import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { businesses, profiles } from "@/lib/db/schema";
import bcrypt from "bcryptjs";
import { z } from "zod";

const setupSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  adminName: z.string().min(1, "Admin name is required"),
  adminEmail: z.string().email("Invalid email address"),
  adminPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = setupSchema.parse(body);

    // Check if email is already in use
    const existingProfile = await db.query.profiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.email, data.adminEmail.toLowerCase()),
    });

    if (existingProfile) {
      return NextResponse.json(
        { error: "Email is already in use" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.adminPassword, 12);

    // Create business
    const [business] = await db
      .insert(businesses)
      .values({
        name: data.companyName,
      })
      .returning();

    // Create admin profile
    await db.insert(profiles).values({
      businessId: business.id,
      role: "admin",
      email: data.adminEmail.toLowerCase(),
      passwordHash,
      fullName: data.adminName,
      hourlyRate: "0.00",
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      businessId: business.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Setup error:", error);
    return NextResponse.json(
      { error: "Failed to create company" },
      { status: 500 }
    );
  }
}
