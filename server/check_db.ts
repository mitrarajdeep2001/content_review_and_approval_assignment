import { db } from './src/db/index.js';
import { sql } from 'drizzle-orm';

async function check() {
  try {
    const res = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'approval_logs'
    `);
    console.log('Columns in approval_logs:', res.rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
