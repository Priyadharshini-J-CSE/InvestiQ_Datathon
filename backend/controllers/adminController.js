const pool = require('../config/db')
const { paginate, respond } = require('../utils/helpers')

exports.getAuditLogs = async (req, res) => {
  const { page, limit, offset } = paginate(req.query.page, req.query.limit)
  const r = await pool.query(
    `SELECT al.*, u.name as user_name FROM audit_logs al LEFT JOIN users u ON al.user_id=u.id ORDER BY al.created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  )
  const c = await pool.query('SELECT COUNT(*) FROM audit_logs')
  respond(res, r.rows, parseInt(c.rows[0].count), page, limit)
}

exports.getActivityLogs = async (req, res) => {
  const { page, limit, offset } = paginate(req.query.page, req.query.limit)
  const r = await pool.query(
    `SELECT al.*, u.name as user_name FROM activity_logs al LEFT JOIN users u ON al.user_id=u.id ORDER BY al.created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  )
  const c = await pool.query('SELECT COUNT(*) FROM activity_logs')
  respond(res, r.rows, parseInt(c.rows[0].count), page, limit)
}

exports.getStations = async (req, res) => {
  const { search } = req.query
  const where = search ? `WHERE name ILIKE $1 OR district ILIKE $1` : ''
  const params = search ? [`%${search}%`] : []
  const r = await pool.query(`SELECT * FROM police_stations ${where} ORDER BY name`, params)
  res.json({ success: true, data: r.rows })
}

exports.createStation = async (req, res) => {
  const { name, district, address, phone } = req.body
  if (!name) return res.status(400).json({ error: 'Station name is required' })
  const r = await pool.query(
    'INSERT INTO police_stations (name,district,address,phone,created_by) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [name, district, address, phone, req.user.id]
  )
  res.status(201).json({ success: true, data: r.rows[0] })
}

exports.getDistricts = async (req, res) => {
  const r = await pool.query('SELECT * FROM districts ORDER BY name')
  res.json({ success: true, data: r.rows })
}
