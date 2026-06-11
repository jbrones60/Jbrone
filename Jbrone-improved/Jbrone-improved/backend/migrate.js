// Run this once on your Railway Postgres to apply schema improvements
// node migrate.js
require('dotenv').config();
const pool = require('./db');

async function migrate() {
  console.log('Running migrations…');

  // Add duration_seconds to call_logs if not exists
  await pool.query(`
    ALTER TABLE call_logs
    ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT NULL
  `);
  console.log('✓ call_logs.duration_seconds');

  // Add index for follow-up queries
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_leads_follow_up_date ON leads (follow_up_date, status)
  `);
  console.log('✓ idx_leads_follow_up_date');

  // Add index for last_called (re-engagement queries)
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_leads_last_called ON leads (last_called, status)
  `);
  console.log('✓ idx_leads_last_called');

  // Add index for priority sorting
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_leads_priority ON leads (priority, id)
  `);
  console.log('✓ idx_leads_priority');

  await pool.end();
  console.log('\nAll migrations complete.');
}

migrate().catch(err => { console.error(err); process.exit(1); });
