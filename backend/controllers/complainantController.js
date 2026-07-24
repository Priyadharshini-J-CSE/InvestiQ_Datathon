const pool = require('../config/db')
const { paginate, respond, logActivity } = require('../utils/helpers')

exports.getAll = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query.page, req.query.limit)
    const { search, fir_id, gender } = req.query
    const conditions = []; const params = []; let i = 1
    if (search) { conditions.push(`(c.full_name ILIKE $${i} OR c.mobile ILIKE $${i})`); params.push(`%${search}%`); i++ }
    if (fir_id) { conditions.push(`c.fir_id=$${i}`); params.push(fir_id); i++ }
    if (gender) { conditions.push(`c.gender=$${i}`); params.push(gender); i++ }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
    const countRes = await pool.query(`SELECT COUNT(*) FROM complainants c ${where}`, params)
    const rows = await pool.query(
      `SELECT c.*, f.fir_number FROM complainants c
       LEFT JOIN firs f ON c.fir_id=f.id
       ${where} ORDER BY c.created_at DESC LIMIT $${i} OFFSET $${i+1}`,
      [...params, limit, offset]
    )
    respond(res, rows.rows, parseInt(countRes.rows[0].count), page, limit)
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.getById = async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT c.*, f.fir_number FROM complainants c LEFT JOIN firs f ON c.fir_id=f.id WHERE c.id=$1`,
      [req.params.id]
    )
    if (!r.rowCount) return res.status(404).json({ error: 'Complainant not found' })
    res.json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.getByFIR = async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM complainants WHERE fir_id=$1 ORDER BY id', [req.params.firId])
    res.json({ success: true, data: r.rows })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.create = async (req, res) => {
  const { fir_id, full_name, age, gender, occupation, religion, caste, mobile, address } = req.body
  if (!full_name) return res.status(400).json({ error: 'Full name is required' })
  try {
    const r = await pool.query(
      `INSERT INTO complainants (fir_id,full_name,age,gender,occupation,religion,caste,mobile,address,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [fir_id||null, full_name, age||null, gender, occupation, religion, caste, mobile, address, req.user.id]
    )
    await logActivity(req.user.id, `Added complainant ${full_name}`, 'Complainants')
    res.status(201).json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.update = async (req, res) => {
  const { fir_id, full_name, age, gender, occupation, religion, caste, mobile, address } = req.body
  try {
    const r = await pool.query(
      `UPDATE complainants SET fir_id=$1,full_name=$2,age=$3,gender=$4,occupation=$5,religion=$6,caste=$7,mobile=$8,address=$9,updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [fir_id||null, full_name, age||null, gender, occupation, religion, caste, mobile, address, req.params.id]
    )
    if (!r.rowCount) return res.status(404).json({ error: 'Complainant not found' })
    res.json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.remove = async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM complainants WHERE id=$1 RETURNING full_name', [req.params.id])
    if (!r.rowCount) return res.status(404).json({ error: 'Complainant not found' })
    res.json({ success: true, message: 'Complainant deleted' })
  } catch (err) { res.status(500).json({ error: err.message }) }
}
