const pool = require('../config/db')
const { paginate, respond, logActivity } = require('../utils/helpers')

exports.getAll = async (req, res) => {
  const { page, limit, offset } = paginate(req.query.page, req.query.limit)
  const { search, case_id, status } = req.query
  const conditions = []; const params = []; let i = 1
  if (search) { conditions.push(`(ch.ipc_section ILIKE $${i} OR ch.description ILIKE $${i})`); params.push(`%${search}%`); i++ }
  if (case_id) { conditions.push(`ch.case_id=$${i}`); params.push(case_id); i++ }
  if (status) { conditions.push(`ch.status=$${i}`); params.push(status); i++ }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
  const countRes = await pool.query(`SELECT COUNT(*) FROM charges ch ${where}`, params)
  const rows = await pool.query(
    `SELECT ch.*, ca.case_number, cr.name as criminal_name FROM charges ch
     LEFT JOIN cases ca ON ch.case_id=ca.id LEFT JOIN criminals cr ON ch.criminal_id=cr.id
     ${where} ORDER BY ch.created_at DESC LIMIT $${i} OFFSET $${i+1}`,
    [...params, limit, offset]
  )
  respond(res, rows.rows, parseInt(countRes.rows[0].count), page, limit)
}

exports.getById = async (req, res) => {
  const r = await pool.query(
    `SELECT ch.*, ca.case_number, cr.name as criminal_name FROM charges ch
     LEFT JOIN cases ca ON ch.case_id=ca.id LEFT JOIN criminals cr ON ch.criminal_id=cr.id WHERE ch.id=$1`,
    [req.params.id]
  )
  if (!r.rowCount) return res.status(404).json({ error: 'Charge not found' })
  res.json({ success: true, data: r.rows[0] })
}

exports.create = async (req, res) => {
  const { case_id, criminal_id, ipc_section, description, filed_date, status } = req.body
  if (!case_id || !ipc_section) return res.status(400).json({ error: 'Case and IPC section are required' })
  try {
    const r = await pool.query(
      `INSERT INTO charges (case_id,criminal_id,ipc_section,description,filed_date,status,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [case_id, criminal_id||null, ipc_section, description, filed_date||null, status||'Pending', req.user.id]
    )
    await logActivity(req.user.id, `Filed charge ${ipc_section}`, 'Charges')
    res.status(201).json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.update = async (req, res) => {
  const { case_id, criminal_id, ipc_section, description, filed_date, status } = req.body
  try {
    const r = await pool.query(
      `UPDATE charges SET case_id=$1,criminal_id=$2,ipc_section=$3,description=$4,filed_date=$5,status=$6,modified_by=$7,updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [case_id, criminal_id||null, ipc_section, description, filed_date||null, status, req.user.id, req.params.id]
    )
    if (!r.rowCount) return res.status(404).json({ error: 'Charge not found' })
    res.json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.remove = async (req, res) => {
  if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Only Admin can delete' })
  const r = await pool.query('DELETE FROM charges WHERE id=$1', [req.params.id])
  if (!r.rowCount) return res.status(404).json({ error: 'Charge not found' })
  res.json({ success: true, message: 'Charge deleted' })
}
