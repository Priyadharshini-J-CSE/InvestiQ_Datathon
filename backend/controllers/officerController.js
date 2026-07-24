const pool = require('../config/db')
const { paginate, respond, logActivity } = require('../utils/helpers')

exports.getAll = async (req, res) => {
  const { page, limit, offset } = paginate(req.query.page, req.query.limit)
  const { search, status, district } = req.query
  const conditions = []; const params = []; let i = 1
  if (search) { conditions.push(`(o.name ILIKE $${i} OR o.badge_number ILIKE $${i} OR o.email ILIKE $${i})`); params.push(`%${search}%`); i++ }
  if (status) { conditions.push(`o.status=$${i}`); params.push(status); i++ }
  if (district) { conditions.push(`o.district=$${i}`); params.push(district); i++ }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
  const countRes = await pool.query(`SELECT COUNT(*) FROM officers o ${where}`, params)
  const rows = await pool.query(
    `SELECT o.*, ps.name as station_name FROM officers o LEFT JOIN police_stations ps ON o.station_id=ps.id
     ${where} ORDER BY o.created_at DESC LIMIT $${i} OFFSET $${i+1}`,
    [...params, limit, offset]
  )
  respond(res, rows.rows, parseInt(countRes.rows[0].count), page, limit)
}

exports.getById = async (req, res) => {
  const r = await pool.query(
    `SELECT o.*, ps.name as station_name FROM officers o LEFT JOIN police_stations ps ON o.station_id=ps.id WHERE o.id=$1`,
    [req.params.id]
  )
  if (!r.rowCount) return res.status(404).json({ error: 'Officer not found' })
  res.json({ success: true, data: r.rows[0] })
}

exports.create = async (req, res) => {
  const { badge_number, name, rank, station_id, district, phone, email, joining_date, status } = req.body
  if (!badge_number || !name) return res.status(400).json({ error: 'Badge number and name are required' })
  try {
    const r = await pool.query(
      `INSERT INTO officers (badge_number,name,rank,station_id,district,phone,email,joining_date,status,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [badge_number, name, rank, station_id||null, district, phone, email, joining_date||null, status||'Active', req.user.id]
    )
    await logActivity(req.user.id, `Added officer ${name}`, 'Officers')
    res.status(201).json({ success: true, data: r.rows[0] })
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Badge number already exists' })
    res.status(500).json({ error: err.message })
  }
}

exports.update = async (req, res) => {
  const { badge_number, name, rank, station_id, district, phone, email, joining_date, status } = req.body
  try {
    const r = await pool.query(
      `UPDATE officers SET badge_number=$1,name=$2,rank=$3,station_id=$4,district=$5,phone=$6,email=$7,joining_date=$8,status=$9,modified_by=$10,updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [badge_number, name, rank, station_id||null, district, phone, email, joining_date||null, status, req.user.id, req.params.id]
    )
    if (!r.rowCount) return res.status(404).json({ error: 'Officer not found' })
    res.json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.remove = async (req, res) => {
  if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Only Admin can delete' })
  const r = await pool.query('DELETE FROM officers WHERE id=$1', [req.params.id])
  if (!r.rowCount) return res.status(404).json({ error: 'Officer not found' })
  res.json({ success: true, message: 'Officer deleted' })
}

exports.getList = async (req, res) => {
  const r = await pool.query('SELECT id, name, badge_number, rank FROM officers WHERE status=$1 ORDER BY name', ['Active'])
  res.json({ success: true, data: r.rows })
}
