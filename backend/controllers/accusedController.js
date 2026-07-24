const pool = require('../config/db')
const { paginate, respond, logActivity } = require('../utils/helpers')

exports.getAll = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query.page, req.query.limit)
    const { search, fir_id, status, gender } = req.query
    const conditions = []; const params = []; let i = 1
    if (search) { conditions.push(`(a.accused_name ILIKE $${i} OR a.alias ILIKE $${i})`); params.push(`%${search}%`); i++ }
    if (fir_id) { conditions.push(`a.fir_id=$${i}`); params.push(fir_id); i++ }
    if (status) { conditions.push(`a.status=$${i}`); params.push(status); i++ }
    if (gender) { conditions.push(`a.gender=$${i}`); params.push(gender); i++ }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
    const countRes = await pool.query(`SELECT COUNT(*) FROM accused a ${where}`, params)
    const rows = await pool.query(
      `SELECT a.*, f.fir_number, c.criminal_id as criminal_ref FROM accused a
       LEFT JOIN firs f ON a.fir_id=f.id
       LEFT JOIN criminals c ON a.criminal_id=c.id
       ${where} ORDER BY a.created_at DESC LIMIT $${i} OFFSET $${i+1}`,
      [...params, limit, offset]
    )
    respond(res, rows.rows, parseInt(countRes.rows[0].count), page, limit)
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.getById = async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT a.*, f.fir_number FROM accused a LEFT JOIN firs f ON a.fir_id=f.id WHERE a.id=$1`,
      [req.params.id]
    )
    if (!r.rowCount) return res.status(404).json({ error: 'Accused not found' })
    res.json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.getByFIR = async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT a.*, c.criminal_id as criminal_ref FROM accused a
       LEFT JOIN criminals c ON a.criminal_id=c.id
       WHERE a.fir_id=$1 ORDER BY a.id`,
      [req.params.firId]
    )
    res.json({ success: true, data: r.rows })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.create = async (req, res) => {
  const { fir_id, criminal_id, accused_name, age, gender, alias, status } = req.body
  if (!accused_name) return res.status(400).json({ error: 'Accused name is required' })
  try {
    const r = await pool.query(
      `INSERT INTO accused (fir_id,criminal_id,accused_name,age,gender,alias,status,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [fir_id||null, criminal_id||null, accused_name, age||null, gender, alias, status||'Under Investigation', req.user.id]
    )
    await logActivity(req.user.id, `Added accused ${accused_name}`, 'Accused')
    res.status(201).json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.update = async (req, res) => {
  const { fir_id, criminal_id, accused_name, age, gender, alias, status } = req.body
  try {
    const r = await pool.query(
      `UPDATE accused SET fir_id=$1,criminal_id=$2,accused_name=$3,age=$4,gender=$5,alias=$6,status=$7,updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [fir_id||null, criminal_id||null, accused_name, age||null, gender, alias, status, req.params.id]
    )
    if (!r.rowCount) return res.status(404).json({ error: 'Accused not found' })
    res.json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.remove = async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM accused WHERE id=$1 RETURNING accused_name', [req.params.id])
    if (!r.rowCount) return res.status(404).json({ error: 'Accused not found' })
    res.json({ success: true, message: 'Accused deleted' })
  } catch (err) { res.status(500).json({ error: err.message }) }
}
