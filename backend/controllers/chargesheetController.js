const pool = require('../config/db')
const { paginate, respond, logActivity } = require('../utils/helpers')

exports.getAll = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query.page, req.query.limit)
    const { search, fir_id, status } = req.query
    const conditions = []; const params = []; let i = 1
    if (search) { conditions.push(`(f.fir_number ILIKE $${i} OR cs.filed_by ILIKE $${i})`); params.push(`%${search}%`); i++ }
    if (fir_id) { conditions.push(`cs.fir_id=$${i}`); params.push(fir_id); i++ }
    if (status) { conditions.push(`cs.status=$${i}`); params.push(status); i++ }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
    const countRes = await pool.query(`SELECT COUNT(*) FROM chargesheet cs LEFT JOIN firs f ON cs.fir_id=f.id ${where}`, params)
    const rows = await pool.query(
      `SELECT cs.*, f.fir_number, u.name as created_by_name FROM chargesheet cs
       LEFT JOIN firs f ON cs.fir_id=f.id
       LEFT JOIN users u ON cs.created_by=u.id
       ${where} ORDER BY cs.created_at DESC LIMIT $${i} OFFSET $${i+1}`,
      [...params, limit, offset]
    )
    respond(res, rows.rows, parseInt(countRes.rows[0].count), page, limit)
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.getById = async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT cs.*, f.fir_number FROM chargesheet cs LEFT JOIN firs f ON cs.fir_id=f.id WHERE cs.id=$1`,
      [req.params.id]
    )
    if (!r.rowCount) return res.status(404).json({ error: 'Chargesheet not found' })
    res.json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.getByFIR = async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM chargesheet WHERE fir_id=$1 ORDER BY id', [req.params.firId])
    res.json({ success: true, data: r.rows })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.create = async (req, res) => {
  const { fir_id, chargesheet_date, chargesheet_type, filed_by, status } = req.body
  if (!fir_id) return res.status(400).json({ error: 'FIR ID is required' })
  try {
    const r = await pool.query(
      `INSERT INTO chargesheet (fir_id,chargesheet_date,chargesheet_type,filed_by,status,created_by)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [fir_id, chargesheet_date||null, chargesheet_type, filed_by, status||'Draft', req.user.id]
    )
    await logActivity(req.user.id, `Created chargesheet for FIR ${fir_id}`, 'Chargesheet')
    res.status(201).json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.update = async (req, res) => {
  const { fir_id, chargesheet_date, chargesheet_type, filed_by, status } = req.body
  try {
    const r = await pool.query(
      `UPDATE chargesheet SET fir_id=$1,chargesheet_date=$2,chargesheet_type=$3,filed_by=$4,status=$5,updated_at=NOW()
       WHERE id=$6 RETURNING *`,
      [fir_id, chargesheet_date||null, chargesheet_type, filed_by, status, req.params.id]
    )
    if (!r.rowCount) return res.status(404).json({ error: 'Chargesheet not found' })
    res.json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.remove = async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM chargesheet WHERE id=$1 RETURNING id', [req.params.id])
    if (!r.rowCount) return res.status(404).json({ error: 'Chargesheet not found' })
    res.json({ success: true, message: 'Chargesheet deleted' })
  } catch (err) { res.status(500).json({ error: err.message }) }
}
