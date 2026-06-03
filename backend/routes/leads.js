const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = express.Router();

const VALID_STATUSES = ['Not Called', 'Called - No Answer', 'Interested', 'Not Interested', 'Follow Up', 'Converted', 'Closed Deal'];
const VALID_PRIORITIES = ['high', 'medium', 'low'];

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

router.get('/stats', auth, async (req, res) => {
  try {
    const [byStatus, byMember, byCategory] = await Promise.all([
      pool.query('SELECT status, COUNT(*) AS count FROM leads GROUP BY status'),
      pool.query(`
        SELECT assigned_to,
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE status = 'Interested') AS interested,
          COUNT(*) FILTER (WHERE status = 'Converted') AS converted
        FROM leads GROUP BY assigned_to
      `),
      pool.query(`
        SELECT category,
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE status != 'Not Called') AS called
        FROM leads GROUP BY category
      `),
    ]);
    res.json({ byStatus: byStatus.rows, byMember: byMember.rows, byCategory: byCategory.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/', auth, async (req, res) => {
  const { category, assigned_to, status, priority, website, search } = req.query;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 30));
  const offset = (page - 1) * limit;

  const conditions = [];
  const values = [];

  if (category) { values.push(category); conditions.push(`category = $${values.length}`); }
  if (assigned_to) { values.push(assigned_to); conditions.push(`assigned_to = $${values.length}`); }
  if (status) { values.push(status); conditions.push(`status = $${values.length}`); }
  if (priority) { values.push(priority); conditions.push(`priority = $${values.length}`); }
  if (website === 'has') conditions.push('has_website = true');
  if (website === 'none') conditions.push('has_website = false');
  if (search) {
    values.push(`%${search}%`);
    conditions.push(`(name ILIKE $${values.length} OR phone ILIKE $${values.length})`);
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  try {
    const [{ rows }, countResult] = await Promise.all([
      pool.query(`SELECT * FROM leads ${where} ORDER BY id LIMIT ${limit} OFFSET ${offset}`, values),
      pool.query(`SELECT COUNT(*) FROM leads ${where}`, values),
    ]);
    const total = parseInt(countResult.rows[0].count);
    res.json({ leads: rows, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { status, assigned_to, priority, notes, follow_up_date } = req.body;

  if (status !== undefined && !VALID_STATUSES.includes(status))
    return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
  if (priority !== undefined && !VALID_PRIORITIES.includes(priority))
    return res.status(400).json({ error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}` });

  try {
    const { rows } = await pool.query(
      `UPDATE leads SET
        status = COALESCE($1, status),
        assigned_to = COALESCE($2, assigned_to),
        priority = COALESCE($3, priority),
        notes = COALESCE($4, notes),
        follow_up_date = COALESCE($5, follow_up_date),
        last_called = NOW()
      WHERE id = $6 RETURNING *`,
      [status, assigned_to, priority, notes, follow_up_date || null, id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Lead not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
