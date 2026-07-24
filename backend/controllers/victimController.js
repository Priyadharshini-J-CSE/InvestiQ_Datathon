const pool = require('../config/db')
const { paginate, respond, logActivity } = require('../utils/helpers')

exports.getAll = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query.page, req.query.limit)
    const { search, fir_id, gender, victim_type } = req.query
    const conditions = []; const params = []; let i = 1
    if (search) { conditions.push(`(v.victim_name ILIKE $${i} OR v.hospital ILIKE $${i})`); params.push(`%${search}%`); i++ }
    if (fir_id) { conditions.push(`v.fir_id=$${i}`); params.push(fir_id); i++ }
    if (gender) { conditions.push(`v.gender=$${i}`); params.push(gender); i++ }
    if (victim_type) { conditions.push(`v.victim_type ILIKE $${i}`); params.push(`%${victim_type}%`); i++ }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
    const countRes = await pool.query(`SELECT COUNT(*) FROM victims v ${where}`, params)
    const rows = await pool.query(
      `SELECT v.*, f.fir_number FROM victims v
       LEFT JOIN firs f ON v.fir_id=f.id
       ${where} ORDER BY v.created_at DESC LIMIT $${i} OFFSET $${i+1}`,
      [...params, limit, offset]
    )
    respond(res, rows.rows, parseInt(countRes.rows[0].count), page, limit)
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.getById = async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT v.*, f.fir_number FROM victims v LEFT JOIN firs f ON v.fir_id=f.id WHERE v.id=$1`,
      [req.params.id]
    )
    if (!r.rowCount) return res.status(404).json({ error: 'Victim not found' })
    res.json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.getByFIR = async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM victims WHERE fir_id=$1 ORDER BY id', [req.params.firId])
    res.json({ success: true, data: r.rows })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.create = async (req, res) => {
  const { fir_id, person_id, victim_name, age, gender, victim_type, injury_type, hospital, remarks } = req.body
  if (!victim_name) return res.status(400).json({ error: 'Victim name is required' })
  try {
    const r = await pool.query(
      `INSERT INTO victims (fir_id,person_id,victim_name,age,gender,victim_type,injury_type,hospital,remarks,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [fir_id||null, person_id||null, victim_name, age||null, gender, victim_type, injury_type, hospital, remarks, req.user.id]
    )
    await logActivity(req.user.id, `Added victim ${victim_name}`, 'Victims')
    res.status(201).json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.update = async (req, res) => {
  const { fir_id, person_id, victim_name, age, gender, victim_type, injury_type, hospital, remarks } = req.body
  try {
    const r = await pool.query(
      `UPDATE victims SET fir_id=$1,person_id=$2,victim_name=$3,age=$4,gender=$5,victim_type=$6,injury_type=$7,hospital=$8,remarks=$9,updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [fir_id||null, person_id||null, victim_name, age||null, gender, victim_type, injury_type, hospital, remarks, req.params.id]
    )
    if (!r.rowCount) return res.status(404).json({ error: 'Victim not found' })
    res.json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.remove = async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM victims WHERE id=$1 RETURNING victim_name', [req.params.id])
    if (!r.rowCount) return res.status(404).json({ error: 'Victim not found' })
    res.json({ success: true, message: 'Victim deleted' })
  } catch (err) { res.status(500).json({ error: err.message }) }
}
