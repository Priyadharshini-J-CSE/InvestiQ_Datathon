const pool = require('../config/db')
const { paginate, respond, logActivity } = require('../utils/helpers')

exports.getAll = async (req, res) => {
  const { page, limit, offset } = paginate(req.query.page, req.query.limit)
  const { search, custody_status, bail_status } = req.query
  const conditions = []; const params = []; let i = 1
  if (search) { conditions.push(`(cr.name ILIKE $${i} OR a.location ILIKE $${i})`); params.push(`%${search}%`); i++ }
  if (custody_status) { conditions.push(`a.custody_status=$${i}`); params.push(custody_status); i++ }
  if (bail_status) { conditions.push(`a.bail_status=$${i}`); params.push(bail_status); i++ }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
  const countRes = await pool.query(`SELECT COUNT(*) FROM arrests a LEFT JOIN criminals cr ON a.criminal_id=cr.id ${where}`, params)
  const rows = await pool.query(
    `SELECT a.*, cr.name as criminal_name, cr.photo_url, o.name as officer_name FROM arrests a
     LEFT JOIN criminals cr ON a.criminal_id=cr.id LEFT JOIN officers o ON a.officer_id=o.id
     ${where} ORDER BY a.created_at DESC LIMIT $${i} OFFSET $${i+1}`,
    [...params, limit, offset]
  )
  respond(res, rows.rows, parseInt(countRes.rows[0].count), page, limit)
}

exports.getById = async (req, res) => {
  const r = await pool.query(
    `SELECT a.*, cr.name as criminal_name, o.name as officer_name FROM arrests a
     LEFT JOIN criminals cr ON a.criminal_id=cr.id LEFT JOIN officers o ON a.officer_id=o.id WHERE a.id=$1`,
    [req.params.id]
  )
  if (!r.rowCount) return res.status(404).json({ error: 'Arrest not found' })
  res.json({ success: true, data: r.rows[0] })
}

exports.create = async (req, res) => {
  const { criminal_id, officer_id, arrest_date, location, reason, bail_status, custody_status } = req.body
  if (!criminal_id || !arrest_date) return res.status(400).json({ error: 'Criminal and arrest date are required' })
  try {
    const r = await pool.query(
      `INSERT INTO arrests (criminal_id,officer_id,arrest_date,location,reason,bail_status,custody_status,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [criminal_id, officer_id||null, arrest_date, location, reason, bail_status||'Not Applied', custody_status||'In Custody', req.user.id]
    )
    await logActivity(req.user.id, `Arrest recorded`, 'Arrests')
    res.status(201).json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.update = async (req, res) => {
  const { criminal_id, officer_id, arrest_date, location, reason, bail_status, custody_status } = req.body
  try {
    const r = await pool.query(
      `UPDATE arrests SET criminal_id=$1,officer_id=$2,arrest_date=$3,location=$4,reason=$5,bail_status=$6,custody_status=$7,modified_by=$8,updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [criminal_id, officer_id||null, arrest_date, location, reason, bail_status, custody_status, req.user.id, req.params.id]
    )
    if (!r.rowCount) return res.status(404).json({ error: 'Arrest not found' })
    res.json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.remove = async (req, res) => {
  if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Only Admin can delete' })
  const r = await pool.query('DELETE FROM arrests WHERE id=$1', [req.params.id])
  if (!r.rowCount) return res.status(404).json({ error: 'Arrest not found' })
  res.json({ success: true, message: 'Arrest deleted' })
}
