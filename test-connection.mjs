import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL;
if (!url) { console.log('DATABASE_URL not set'); process.exit(1); }

const host = url.match(/@([^/]+)\//)?.[1];
console.log('Host:', host);

try {
  const sql = neon(url);

  // Basic connectivity
  const [ver] = await sql`SELECT version() as v, current_database() as db, now() as t`;
  console.log('✓ Connected to database:', ver.db);
  console.log('  Server time:', ver.t);
  console.log('  PG version:', ver.v.substring(0, 60) + '...');

  // Table count
  const tables = await sql`SELECT count(*) as cnt FROM information_schema.tables WHERE table_schema = 'public'`;
  console.log('✓ Public tables:', tables[0].cnt);

  // List tables
  const tableNames = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
  console.log('  Tables:', tableNames.map(t => t.table_name).join(', '));

  // Check active connections
  const conns = await sql`SELECT count(*) as cnt FROM pg_stat_activity WHERE datname = current_database()`;
  console.log('✓ Active connections:', conns[0].cnt);

  // Check RLS status
  const rls = await sql`SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true`;
  console.log('✓ Tables with RLS enabled:', rls.length > 0 ? rls.map(r => r.tablename).join(', ') : 'none');

  console.log('\n🟢 All connection checks passed!');
} catch (err) {
  console.error('🔴 Connection FAILED:', err.message);
  process.exit(1);
}
