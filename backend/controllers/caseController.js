const pool = require('../config/db')
const { paginate, respond, logActivity } = require('../utils/helpers')

exports.getAll = async (req, res) => {
  const { page, limit, offset } = paginate(req.query.page, req.query.limit)
  const { search, status } = req.query
  const conditions = []; const params = []; let i = 1
  if (search) { conditions.push(`(ca.case_number ILIKE $${i} OR ca.court ILIKE $${i} OR ca.judge ILIKE $${i})`); params.push(`%${search}%`); i++ }
  if (status) { conditions.push(`ca.status=$${i}`); params.push(status); i++ }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
  const countRes = await pool.query(`SELECT COUNT(*) FROM cases ca ${where}`, params)
  const rows = await pool.query(
    `SELECT ca.*, f.fir_number, o.name as officer_name FROM cases ca
     LEFT JOIN firs f ON ca.fir_id=f.id LEFT JOIN officers o ON ca.officer_id=o.id
     ${where} ORDER BY ca.created_at DESC LIMIT $${i} OFFSET $${i+1}`,
    [...params, limit, offset]
  )
  respond(res, rows.rows, parseInt(countRes.rows[0].count), page, limit)
}

exports.getById = async (req, res) => {
  const r = await pool.query(
    `SELECT ca.*, f.fir_number, o.name as officer_name FROM cases ca
     LEFT JOIN firs f ON ca.fir_id=f.id LEFT JOIN officers o ON ca.officer_id=o.id WHERE ca.id=$1`,
    [req.params.id]
  )
  if (!r.rowCount) return res.status(404).json({ error: 'Case not found' })
  res.json({ success: true, data: r.rows[0] })
}

exports.create = async (req, res) => {
  const { case_number, fir_id, court, judge, officer_id, status, investigation_status, court_date, closing_date, notes } = req.body
  if (!case_number) return res.status(400).json({ error: 'Case number is required' })
  try {
    const r = await pool.query(
      `INSERT INTO cases (case_number,fir_id,court,judge,officer_id,status,investigation_status,court_date,closing_date,notes,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [case_number, fir_id||null, court, judge, officer_id||null, status||'Open', investigation_status||'Ongoing', court_date||null, closing_date||null, notes, req.user.id]
    )
    await logActivity(req.user.id, `Created case ${case_number}`, 'Cases')
    res.status(201).json({ success: true, data: r.rows[0] })
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Case number already exists' })
    res.status(500).json({ error: err.message })
  }
}

exports.update = async (req, res) => {
  const { case_number, fir_id, court, judge, officer_id, status, investigation_status, court_date, closing_date, notes } = req.body
  try {
    const r = await pool.query(
      `UPDATE cases SET case_number=$1,fir_id=$2,court=$3,judge=$4,officer_id=$5,status=$6,investigation_status=$7,court_date=$8,closing_date=$9,notes=$10,modified_by=$11,updated_at=NOW()
       WHERE id=$12 RETURNING *`,
      [case_number, fir_id||null, court, judge, officer_id||null, status, investigation_status, court_date||null, closing_date||null, notes, req.user.id, req.params.id]
    )
    if (!r.rowCount) return res.status(404).json({ error: 'Case not found' })
    res.json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.remove = async (req, res) => {
  if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Only Admin can delete' })
  const r = await pool.query('DELETE FROM cases WHERE id=$1', [req.params.id])
  if (!r.rowCount) return res.status(404).json({ error: 'Case not found' })
  res.json({ success: true, message: 'Case deleted' })
}
