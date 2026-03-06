import { neon } from "@neondatabase/serverless";
import * as fs from "fs";
import * as path from "path";

async function migrate() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const sql = neon(databaseUrl);

  const migrationPath = path.join(__dirname, "migrations", "0000_init.sql");
  const migration = fs.readFileSync(migrationPath, "utf-8");

  // Split on semicolons but keep the SQL intact for multi-statement execution
  // Filter out empty statements and comments-only blocks
  const statements = migration
    .split(/;\s*$/m)
    .map((s) => s.trim())
    .filter(
      (s) =>
        s.length > 0 &&
        !s
          .split("\n")
          .every((line) => line.trim().startsWith("--") || line.trim() === "")
    );

  console.log(`Running ${statements.length} SQL statements...`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.substring(0, 80).replace(/\n/g, " ");
    try {
      await sql(stmt);
      console.log(`  [${i + 1}/${statements.length}] ✓ ${preview}...`);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : String(error);
      // Skip "already exists" errors for idempotency
      if (
        message.includes("already exists") ||
        message.includes("duplicate")
      ) {
        console.log(
          `  [${i + 1}/${statements.length}] ⊘ Skipped (already exists): ${preview}...`
        );
      } else {
        console.error(
          `  [${i + 1}/${statements.length}] ✗ FAILED: ${preview}...`
        );
        console.error(`    Error: ${message}`);
        // Don't exit — continue with remaining statements
      }
    }
  }

  console.log("\nMigration complete!");
}

migrate().catch(console.error);
