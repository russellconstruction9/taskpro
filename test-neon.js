
const { neon } = require('@neondatabase/serverless');

async function test() {
    const url = 'postgresql://neondb_owner:npg_zEF47hiwIrKq@ep-soft-sky-ai6anuny-pooler.c-4.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require';
    try {
        const sql = neon(url);
        const result = await sql`SELECT 1 as connected`;
        console.log('Connected:', result);
    } catch (err) {
        console.error('Connection failed:', err);
    }
}

test();
