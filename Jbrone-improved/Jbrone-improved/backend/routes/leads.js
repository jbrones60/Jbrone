const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const pool = require('../db');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const VALID_STATUSES = ['Not Called', 'Called - No Answer', 'Interested', 'Not Interested', 'Follow Up', 'Converted', 'Closed Deal'];
const VALID_PRIORITIES = ['high', 'medium', 'low'];
const VALID_LOST_REASONS = ['Already has website', 'Too expensive', 'Not decision maker', 'Bad timing', 'No interest in digital', 'Other'];

function normalisePhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : null;
}

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'No token' });
  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  function parseLine(line) {
    const fields = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        fields.push(current); current = '';
      } else {
        current += ch;
      }
    }
    fields.push(current);
    return fields;
  }

  const headers = parseLine(lines[0]).map(h => h.trim().toLowerCase());
  return lines.slice(1).map(line => {
    const values = parseLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (values[i] || '').trim(); });
    return obj;
  });
}

// ── Stats ──────────────────────────────────────────────────────────────────
router.get('/stats', auth, async (req, res) => {
  try {
    const [byStatus, byMember, byCategory, byLostReason, dailyActivity, followUpsDue] = await Promise.all([
      pool.query('SELECT status, COUNT(*) AS count FROM leads WHERE archived_at IS NULL GROUP BY status'),
      pool.query(`
        SELECT assigned_to,
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE status = 'Interested') AS interested,
          COUNT(*) FILTER (WHERE status = 'Converted') AS converted,
          COUNT(*) FILTER (WHERE status = 'Called - No Answer') AS no_answer,
          COUNT(*) FILTER (WHERE last_called >= NOW() - INTERVAL '24 hours') AS called_today
        FROM leads WHERE archived_at IS NULL GROUP BY assigned_to
      `),
      pool.query(`
        SELECT category,
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE status != 'Not Called') AS called
        FROM leads WHERE archived_at IS NULL GROUP BY category
      `),
      pool.query(`
        SELECT lost_reason, COUNT(*) AS count
        FROM leads WHERE lost_reason IS NOT NULL AND archived_at IS NULL
        GROUP BY lost_reason ORDER BY count DESC
      `),
      pool.query(`
        SELECT DATE(created_at) AS day, COUNT(*) AS calls
        FROM call_logs
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(created_at) ORDER BY day ASC
      `),
      pool.query(`
        SELECT COUNT(*) AS overdue FROM leads
        WHERE follow_up_date <= CURRENT_DATE AND status = 'Follow Up' AND archived_at IS NULL
      `),
    ]);
    res.json({
      byStatus: byStatus.rows,
      byMember: byMember.rows,
      byCategory: byCategory.rows,
      byLostReason: byLostReason.rows,
      dailyActivity: dailyActivity.rows,
      followUpsDue: parseInt(followUpsDue.rows[0].overdue),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Re-engagement ──────────────────────────────────────────────────────────
router.get('/reengagement', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM leads
      WHERE status = 'Not Interested'
        AND last_called < NOW() - INTERVAL '60 days'
        AND archived_at IS NULL
      ORDER BY last_called ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Follow-up queue ────────────────────────────────────────────────────────
router.get('/follow-ups', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM leads
      WHERE follow_up_date <= CURRENT_DATE
        AND status = 'Follow Up'
        AND archived_at IS NULL
      ORDER BY follow_up_date ASC, priority DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Archived leads ─────────────────────────────────────────────────────────
router.get('/archived', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM leads WHERE archived_at IS NOT NULL ORDER BY archived_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── CSV backup ─────────────────────────────────────────────────────────────
router.get('/backup', auth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM leads WHERE archived_at IS NULL ORDER BY id');
    if (!rows.length) return res.status(204).end();

    const cols = Object.keys(rows[0]);
    const escape = (v) => {
      if (v === null || v === undefined) return '';
      const s = String(v);
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [cols.join(','), ...rows.map(r => cols.map(c => escape(r[c])).join(','))].join('\n');
    const date = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="leads-backup-${date}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── List leads (with filters) ──────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  const { category, assigned_to, status, priority, website, search, follow_up_due } = req.query;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 30));
  const offset = (page - 1) * limit;

  const conditions = ['archived_at IS NULL'];
  const values = [];

  if (category)    { values.push(category);    conditions.push(`category = $${values.length}`); }
  if (assigned_to) { values.push(assigned_to); conditions.push(`assigned_to = $${values.length}`); }
  if (status)      { values.push(status);      conditions.push(`status = $${values.length}`); }
  if (priority)    { values.push(priority);    conditions.push(`priority = $${values.length}`); }
  if (website === 'has')  conditions.push('has_website = true');
  if (website === 'none') conditions.push('has_website = false');
  if (follow_up_due === 'today') conditions.push(`follow_up_date <= CURRENT_DATE AND status = 'Follow Up'`);
  if (search) {
    values.push(`%${search}%`);
    conditions.push(`(name ILIKE $${values.length} OR phone ILIKE $${values.length})`);
  }

  const where = 'WHERE ' + conditions.join(' AND ');
  try {
    const [{ rows }, countResult] = await Promise.all([
      pool.query(`SELECT * FROM leads ${where} ORDER BY
        CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
        id LIMIT ${limit} OFFSET ${offset}`, values),
      pool.query(`SELECT COUNT(*) FROM leads ${where}`, values),
    ]);
    const total = parseInt(countResult.rows[0].count);
    res.json({ leads: rows, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── CSV import ─────────────────────────────────────────────────────────────
router.post('/import', auth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const rows = parseCSV(req.file.buffer.toString('utf-8'));
  if (!rows.length) return res.json({ inserted: 0, skipped: 0 });

  let inserted = 0, skipped = 0;

  for (const row of rows) {
    const name = row.name;
    const category = row.category;
    if (!name || !category) { skipped++; continue; }

    const normPhone = normalisePhone(row.phone || '');
    if (normPhone) {
      const { rows: existing } = await pool.query(
        `SELECT id FROM leads WHERE RIGHT(REGEXP_REPLACE(COALESCE(phone,''), '[^0-9]', '', 'g'), 10) = $1`,
        [normPhone]
      );
      if (existing.length) { skipped++; continue; }
    }

    try {
      await pool.query(
        `INSERT INTO leads (name, type, address, phone, website, category) VALUES ($1, $2, $3, $4, $5, $6)`,
        [name, row.type || null, row.address || null, row.phone || null, row.website || null, category]
      );
      inserted++;
    } catch {
      skipped++;
    }
  }

  res.json({ inserted, skipped });
});

// ── Create lead ────────────────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  const { name, type, address, phone, website, category } = req.body;
  if (!name || !category) return res.status(400).json({ error: 'name and category are required' });

  const normPhone = normalisePhone(phone);
  if (normPhone) {
    const { rows: existing } = await pool.query(
      `SELECT id, name FROM leads WHERE RIGHT(REGEXP_REPLACE(COALESCE(phone,''), '[^0-9]', '', 'g'), 10) = $1`,
      [normPhone]
    );
    if (existing[0])
      return res.status(409).json({ error: `A lead with this phone number already exists: ${existing[0].name}` });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO leads (name, type, address, phone, website, category) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, type || null, address || null, phone || null, website || null, category]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Archive lead (soft delete) ─────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE leads SET archived_at = NOW() WHERE id = $1 AND archived_at IS NULL RETURNING id',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Lead not found' });
    res.json({ id: rows[0].id });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Call logs ──────────────────────────────────────────────────────────────
router.post('/:id/logs', auth, async (req, res) => {
  const { id } = req.params;
  const { status_set, notes, duration_seconds } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO call_logs (lead_id, logged_by, status_set, notes, duration_seconds) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, req.user.name, status_set || null, notes || '', duration_seconds || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id/logs', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM call_logs WHERE lead_id = $1 ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Update lead ────────────────────────────────────────────────────────────
router.patch('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const ALLOWED = ['status', 'assigned_to', 'priority', 'notes', 'follow_up_date', 'lost_reason'];
  const updates = Object.fromEntries(ALLOWED.filter(k => k in req.body).map(k => [k, req.body[k]]));

  if (!Object.keys(updates).length) return res.status(400).json({ error: 'No fields to update' });

  if ('status' in updates && updates.status !== null && !VALID_STATUSES.includes(updates.status))
    return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
  if ('priority' in updates && updates.priority !== null && !VALID_PRIORITIES.includes(updates.priority))
    return res.status(400).json({ error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}` });
  if ('lost_reason' in updates && updates.lost_reason !== null && !VALID_LOST_REASONS.includes(updates.lost_reason))
    return res.status(400).json({ error: `Invalid lost_reason. Must be one of: ${VALID_LOST_REASONS.join(', ')}` });

  const keys = Object.keys(updates);
  const setClauses = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
  try {
    const { rows } = await pool.query(
      `UPDATE leads SET ${setClauses}, last_called = NOW() WHERE id = $${keys.length + 1} AND archived_at IS NULL RETURNING *`,
      [...keys.map(k => updates[k]), id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Lead not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
