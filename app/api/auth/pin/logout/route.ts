import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * POST /api/auth/pin/logout
 * Clears the worker session cookie.
 */
export async function POST(_request: NextRequest) {
  const cookieStore = await cookies();
  cookieStore.delete("worker-token");

  return NextResponse.json({ success: true });
}
