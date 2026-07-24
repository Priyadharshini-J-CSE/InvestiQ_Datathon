const pool = require('../config/db')
const { paginate, respond, logActivity } = require('../utils/helpers')

exports.getAll = async (req, res) => {
  const { page, limit, offset } = paginate(req.query.page, req.query.limit)
  const { search, status, risk_level, crime_category } = req.query
  const conditions = []; const params = []; let i = 1
  if (search) { conditions.push(`(c.name ILIKE $${i} OR c.alias ILIKE $${i} OR c.criminal_id ILIKE $${i})`); params.push(`%${search}%`); i++ }
  if (status) { conditions.push(`c.status=$${i}`); params.push(status); i++ }
  if (risk_level) { conditions.push(`c.risk_level=$${i}`); params.push(risk_level); i++ }
  if (crime_category) { conditions.push(`c.crime_category ILIKE $${i}`); params.push(`%${crime_category}%`); i++ }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
  const countRes = await pool.query(`SELECT COUNT(*) FROM criminals c ${where}`, params)
  const rows = await pool.query(`SELECT c.* FROM criminals c ${where} ORDER BY c.created_at DESC LIMIT $${i} OFFSET $${i+1}`, [...params, limit, offset])
  respond(res, rows.rows, parseInt(countRes.rows[0].count), page, limit)
}

exports.getById = async (req, res) => {
  const r = await pool.query('SELECT * FROM criminals WHERE id=$1', [req.params.id])
  if (!r.rowCount) return res.status(404).json({ error: 'Criminal not found' })
  res.json({ success: true, data: r.rows[0] })
}

exports.create = async (req, res) => {
  const { name, alias, gender, age, address, fingerprint_id, dna_id, risk_level, gang, crime_category, repeat_offender, status, notes, photo_url, person_id } = req.body
  if (!name) return res.status(400).json({ error: 'Name is required' })
  const criminal_id = `CRM-${Date.now()}`
  try {
    const r = await pool.query(
      `INSERT INTO criminals (criminal_id,person_id,name,alias,gender,age,address,fingerprint_id,dna_id,risk_level,gang,crime_category,repeat_offender,status,notes,photo_url,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
      [criminal_id, person_id||null, name, alias, gender, age||null, address, fingerprint_id, dna_id, risk_level||'Low', gang, crime_category, repeat_offender||false, status||'Active', notes, photo_url, req.user.id]
    )
    await logActivity(req.user.id, `Added criminal ${name}`, 'Criminals')
    res.status(201).json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.update = async (req, res) => {
  const { name, alias, gender, age, address, fingerprint_id, dna_id, risk_level, gang, crime_category, repeat_offender, status, notes, photo_url } = req.body
  try {
    const r = await pool.query(
      `UPDATE criminals SET name=$1,alias=$2,gender=$3,age=$4,address=$5,fingerprint_id=$6,dna_id=$7,risk_level=$8,gang=$9,crime_category=$10,repeat_offender=$11,status=$12,notes=$13,photo_url=$14,modified_by=$15,updated_at=NOW()
       WHERE id=$16 RETURNING *`,
      [name, alias, gender, age||null, address, fingerprint_id, dna_id, risk_level, gang, crime_category, repeat_offender||false, status, notes, photo_url, req.user.id, req.params.id]
    )
    if (!r.rowCount) return res.status(404).json({ error: 'Criminal not found' })
    res.json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.remove = async (req, res) => {
  if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Only Admin can delete records' })
  const r = await pool.query('DELETE FROM criminals WHERE id=$1 RETURNING name', [req.params.id])
  if (!r.rowCount) return res.status(404).json({ error: 'Criminal not found' })
  res.json({ success: true, message: 'Criminal deleted' })
}
