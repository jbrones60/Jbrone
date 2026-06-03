require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('./db');
const leads = require('./data/leads.json');

async function seed() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS leads (
      id SERIAL PRIMARY KEY,
      name TEXT,
      type TEXT,
      address TEXT,
      phone TEXT,
      website TEXT,
      category TEXT,
      status TEXT DEFAULT 'Not Called',
      assigned_to TEXT DEFAULT 'Ravi',
      priority TEXT DEFAULT 'low',
      notes TEXT DEFAULT '',
      last_called TIMESTAMP,
      follow_up_date DATE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      has_website BOOLEAN GENERATED ALWAYS AS (website IS NOT NULL AND website != '') STORED
    )
  `);

  await pool.query(`
    CREATE OR REPLACE FUNCTION update_timestamp()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS call_logs (
      id SERIAL PRIMARY KEY,
      lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
      logged_by TEXT,
      status_set TEXT,
      notes TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_leads_status_category ON leads (status, category);
  `);

  await pool.query(`
    DROP TRIGGER IF EXISTS set_updated_at ON leads;
    CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
  `);

  const seedUsers = [
    { name: 'Ravi',   email: 'ravi@agency.com',   password: 'ravi123' },
    { name: 'Priya',  email: 'priya@agency.com',  password: 'priya123' },
    { name: 'Suresh', email: 'suresh@agency.com', password: 'suresh123' },
  ];

  for (const u of seedUsers) {
    const hash = await bcrypt.hash(u.password, 10);
    await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING',
      [u.name, u.email, hash]
    );
  }
  console.log('Users seeded.');

  await pool.query('DELETE FROM leads');
  console.log('Leads table cleared.');

  for (const lead of leads) {
    await pool.query(
      `INSERT INTO leads (name, type, address, phone, website, category)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [lead.name, lead.type || null, lead.address || null, lead.phone || null, lead.website || null, lead.category]
    );
  }
  console.log(`${leads.length} leads seeded.`);

  await pool.end();
}

seed().catch(err => { console.error(err); process.exit(1); });
