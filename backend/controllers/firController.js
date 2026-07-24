const pool = require('../config/db')
const { paginate, respond, logActivity } = require('../utils/helpers')

exports.getAll = async (req, res) => {
  const { page, limit, offset } = paginate(req.query.page, req.query.limit)
  const { search, status, district, crime_type } = req.query
  const conditions = []
  const params = []
  let i = 1
  if (search) { conditions.push(`(f.fir_number ILIKE $${i} OR f.complainant ILIKE $${i} OR f.accused ILIKE $${i} OR f.victim ILIKE $${i})`); params.push(`%${search}%`); i++ }
  if (status) { conditions.push(`f.status = $${i}`); params.push(status); i++ }
  if (district) { conditions.push(`f.district = $${i}`); params.push(district); i++ }
  if (crime_type) { conditions.push(`f.crime_type ILIKE $${i}`); params.push(`%${crime_type}%`); i++ }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
  const countRes = await pool.query(`SELECT COUNT(*) FROM firs f ${where}`, params)
  const rows = await pool.query(
    `SELECT f.*, o.name as officer_name, ps.name as station_name
     FROM firs f
     LEFT JOIN officers o ON f.officer_id = o.id
     LEFT JOIN police_stations ps ON f.station_id = ps.id
     ${where} ORDER BY f.created_at DESC LIMIT $${i} OFFSET $${i+1}`,
    [...params, limit, offset]
  )
  respond(res, rows.rows, parseInt(countRes.rows[0].count), page, limit)
}

exports.getById = async (req, res) => {
  const r = await pool.query(
    `SELECT f.*, o.name as officer_name, ps.name as station_name
     FROM firs f LEFT JOIN officers o ON f.officer_id=o.id LEFT JOIN police_stations ps ON f.station_id=ps.id
     WHERE f.id=$1`, [req.params.id])
  if (!r.rowCount) return res.status(404).json({ error: 'FIR not found' })
  res.json({ success: true, data: r.rows[0] })
}

exports.create = async (req, res) => {
  const { fir_number, station_id, district, date, crime_type, ipc_sections, complainant, victim, accused, description, status, officer_id } = req.body
  if (!fir_number || !date) return res.status(400).json({ error: 'FIR number and date are required' })
  try {
    const r = await pool.query(
      `INSERT INTO firs (fir_number,station_id,district,date,crime_type,ipc_sections,complainant,victim,accused,description,status,officer_id,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [fir_number, station_id||null, district, date, crime_type, ipc_sections, complainant, victim, accused, description, status||'Open', officer_id||null, req.user.id]
    )
    await logActivity(req.user.id, `Created FIR ${fir_number}`, 'FIR')
    res.status(201).json({ success: true, data: r.rows[0] })
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'FIR number already exists' })
    res.status(500).json({ error: err.message })
  }
}

exports.update = async (req, res) => {
  const { fir_number, station_id, district, date, crime_type, ipc_sections, complainant, victim, accused, description, status, officer_id } = req.body
  try {
    const r = await pool.query(
      `UPDATE firs SET fir_number=$1,station_id=$2,district=$3,date=$4,crime_type=$5,ipc_sections=$6,
       complainant=$7,victim=$8,accused=$9,description=$10,status=$11,officer_id=$12,modified_by=$13,updated_at=NOW()
       WHERE id=$14 RETURNING *`,
      [fir_number, station_id||null, district, date, crime_type, ipc_sections, complainant, victim, accused, description, status, officer_id||null, req.user.id, req.params.id]
    )
    if (!r.rowCount) return res.status(404).json({ error: 'FIR not found' })
    await logActivity(req.user.id, `Updated FIR ${fir_number}`, 'FIR')
    res.json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.remove = async (req, res) => {
  if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Only Admin can delete records' })
  const r = await pool.query('DELETE FROM firs WHERE id=$1 RETURNING fir_number', [req.params.id])
  if (!r.rowCount) return res.status(404).json({ error: 'FIR not found' })
  await logActivity(req.user.id, `Deleted FIR ${r.rows[0].fir_number}`, 'FIR')
  res.json({ success: true, message: 'FIR deleted' })
}
