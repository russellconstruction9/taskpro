import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, { schema });

/**
 * Execute a callback with RLS context set for the current request.
 * Sets session variables so Postgres RLS policies can enforce tenant isolation.
 */
export async function withRLS<T>(
  businessId: number,
  profileId: number,
  callback: () => Promise<T>
): Promise<T> {
  // Set session-level variables for RLS policies
  await sql(`SELECT set_config('app.current_business_id', $1::text, true)`, [
    businessId.toString(),
  ]);
  await sql(`SELECT set_config('app.current_profile_id', $1::text, true)`, [
    profileId.toString(),
  ]);

  return callback();
}
