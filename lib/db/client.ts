import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import * as schema from "./schema";

// Fallback for Next.js build step when DATABASE_URL may not be present
const dbUrl = process.env.DATABASE_URL || "postgresql://dummy:dummy@dummy/dummy";
const neonHttp = neon(dbUrl);

export const db = drizzle(neonHttp, { schema });

// The transaction object type exposed from Drizzle's neon-http adapter.
export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Execute a callback with RLS context set for the current request.
 * All queries run inside a single transaction so the set_config values
 * are visible to every query — each neon-http sql() call is a separate
 * HTTP request (separate connection), so setting session vars outside a
 * transaction would be lost before the callback runs.
 */
export async function withRLS<T>(
  businessId: number,
  profileId: number,
  callback: (tx: DbTransaction) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT set_config('app.current_business_id', ${businessId.toString()}, true)`
    );
    await tx.execute(
      sql`SELECT set_config('app.current_profile_id', ${profileId.toString()}, true)`
    );
    return callback(tx);
  });
}
