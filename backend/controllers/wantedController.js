const pool = require('../config/db')
const { paginate, respond, logActivity } = require('../utils/helpers')

exports.getAll = async (req, res) => {
  const { page, limit, offset } = paginate(req.query.page, req.query.limit)
  const { search, status, priority } = req.query
  const conditions = []; const params = []; let i = 1
  if (search) { conditions.push(`(c.name ILIKE $${i} OR c.alias ILIKE $${i})`); params.push(`%${search}%`); i++ }
  if (status) { conditions.push(`w.status=$${i}`); params.push(status); i++ }
  if (priority) { conditions.push(`w.priority=$${i}`); params.push(priority); i++ }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
  const countRes = await pool.query(`SELECT COUNT(*) FROM wanted w LEFT JOIN criminals c ON w.criminal_id=c.id ${where}`, params)
  const rows = await pool.query(
    `SELECT w.*, c.name as criminal_name, c.alias, c.photo_url, c.risk_level, c.crime_category
     FROM wanted w LEFT JOIN criminals c ON w.criminal_id=c.id
     ${where} ORDER BY w.created_at DESC LIMIT $${i} OFFSET $${i+1}`,
    [...params, limit, offset]
  )
  respond(res, rows.rows, parseInt(countRes.rows[0].count), page, limit)
}

exports.getById = async (req, res) => {
  const r = await pool.query(
    `SELECT w.*, c.name as criminal_name, c.alias, c.photo_url, c.risk_level FROM wanted w LEFT JOIN criminals c ON w.criminal_id=c.id WHERE w.id=$1`,
    [req.params.id]
  )
  if (!r.rowCount) return res.status(404).json({ error: 'Not found' })
  res.json({ success: true, data: r.rows[0] })
}

exports.create = async (req, res) => {
  const { criminal_id, reward, declared_date, priority, last_seen, last_seen_date, status, notes } = req.body
  if (!criminal_id) return res.status(400).json({ error: 'Criminal is required' })
  try {
    const r = await pool.query(
      `INSERT INTO wanted (criminal_id,reward,declared_date,priority,last_seen,last_seen_date,status,notes,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [criminal_id, reward||null, declared_date||null, priority||'Medium', last_seen, last_seen_date||null, status||'Active', notes, req.user.id]
    )
    await logActivity(req.user.id, `Added wanted record`, 'Wanted')
    res.status(201).json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.update = async (req, res) => {
  const { criminal_id, reward, declared_date, priority, last_seen, last_seen_date, status, notes } = req.body
  try {
    const r = await pool.query(
      `UPDATE wanted SET criminal_id=$1,reward=$2,declared_date=$3,priority=$4,last_seen=$5,last_seen_date=$6,status=$7,notes=$8,modified_by=$9,updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [criminal_id, reward||null, declared_date||null, priority, last_seen, last_seen_date||null, status, notes, req.user.id, req.params.id]
    )
    if (!r.rowCount) return res.status(404).json({ error: 'Not found' })
    res.json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.remove = async (req, res) => {
  if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Only Admin can delete' })
  const r = await pool.query('DELETE FROM wanted WHERE id=$1', [req.params.id])
  if (!r.rowCount) return res.status(404).json({ error: 'Not found' })
  res.json({ success: true, message: 'Deleted' })
}
