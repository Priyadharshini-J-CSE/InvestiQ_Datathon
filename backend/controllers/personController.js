const pool = require('../config/db')
const { paginate, respond, logActivity } = require('../utils/helpers')

exports.getAll = async (req, res) => {
  const { page, limit, offset } = paginate(req.query.page, req.query.limit)
  const { search, gender } = req.query
  const conditions = []; const params = []; let i = 1
  if (search) { conditions.push(`(full_name ILIKE $${i} OR phone ILIKE $${i} OR aadhaar ILIKE $${i} OR person_id ILIKE $${i})`); params.push(`%${search}%`); i++ }
  if (gender) { conditions.push(`gender=$${i}`); params.push(gender); i++ }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
  const countRes = await pool.query(`SELECT COUNT(*) FROM persons ${where}`, params)
  const rows = await pool.query(`SELECT * FROM persons ${where} ORDER BY created_at DESC LIMIT $${i} OFFSET $${i+1}`, [...params, limit, offset])
  respond(res, rows.rows, parseInt(countRes.rows[0].count), page, limit)
}

exports.getById = async (req, res) => {
  const r = await pool.query('SELECT * FROM persons WHERE id=$1', [req.params.id])
  if (!r.rowCount) return res.status(404).json({ error: 'Person not found' })
  res.json({ success: true, data: r.rows[0] })
}

exports.create = async (req, res) => {
  const { full_name, gender, dob, age, phone, email, occupation, nationality, address, aadhaar, photo_url } = req.body
  if (!full_name) return res.status(400).json({ error: 'Full name is required' })
  const person_id = `PER-${Date.now()}`
  try {
    const r = await pool.query(
      `INSERT INTO persons (person_id,full_name,gender,dob,age,phone,email,occupation,nationality,address,aadhaar,photo_url,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [person_id, full_name, gender, dob||null, age||null, phone, email, occupation, nationality||'Indian', address, aadhaar, photo_url, req.user.id]
    )
    await logActivity(req.user.id, `Added person ${full_name}`, 'Persons')
    res.status(201).json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.update = async (req, res) => {
  const { full_name, gender, dob, age, phone, email, occupation, nationality, address, aadhaar, photo_url } = req.body
  try {
    const r = await pool.query(
      `UPDATE persons SET full_name=$1,gender=$2,dob=$3,age=$4,phone=$5,email=$6,occupation=$7,nationality=$8,address=$9,aadhaar=$10,photo_url=$11,modified_by=$12,updated_at=NOW()
       WHERE id=$13 RETURNING *`,
      [full_name, gender, dob||null, age||null, phone, email, occupation, nationality, address, aadhaar, photo_url, req.user.id, req.params.id]
    )
    if (!r.rowCount) return res.status(404).json({ error: 'Person not found' })
    res.json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.remove = async (req, res) => {
  if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Only Admin can delete records' })
  const r = await pool.query('DELETE FROM persons WHERE id=$1 RETURNING full_name', [req.params.id])
  if (!r.rowCount) return res.status(404).json({ error: 'Person not found' })
  res.json({ success: true, message: 'Person deleted' })
}
