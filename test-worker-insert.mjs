import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql as dsql } from "drizzle-orm";
import { config } from "dotenv";

config({ path: ".env.local" });

const neonHttp = neon(process.env.DATABASE_URL);
const db = drizzle(neonHttp);

try {
  const result = await db.transaction(async (tx) => {
    await tx.execute(
      dsql`SELECT set_config('app.current_business_id', '1', true)`
    );
    await tx.execute(
      dsql`SELECT set_config('app.current_profile_id', '1', true)`
    );

    const rows = await tx.execute(
      dsql`INSERT INTO profiles (business_id, full_name, role, email, password_hash, pin_hash, hourly_rate) 
           VALUES (1, 'Direct Test Worker', 'worker', NULL, NULL, NULL, '25.00')
           RETURNING id, full_name, role, email, hourly_rate, is_active, created_at`
    );
    return rows;
  });
  console.log("SUCCESS:", JSON.stringify(result.rows || result));

  // Cleanup
  const id = (result.rows || result)[0].id;
  await neonHttp(`DELETE FROM profiles WHERE id = ${id}`);
  console.log("Cleaned up test worker id:", id);
} catch (e) {
  console.log("ERROR:", e.message);
  console.log("Code:", e.code);
  console.log(
    "Full error:",
    JSON.stringify(e, Object.getOwnPropertyNames(e))
  );
}
