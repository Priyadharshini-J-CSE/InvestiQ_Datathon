const pool = require('../config/db')
const bcrypt = require('bcryptjs')
const { paginate, respond, logActivity } = require('../utils/helpers')

exports.getAll = async (req, res) => {
  const { page, limit, offset } = paginate(req.query.page, req.query.limit)
  const { search, role, status } = req.query
  const conditions = []; const params = []; let i = 1
  if (search) { conditions.push(`(username ILIKE $${i} OR name ILIKE $${i})`); params.push(`%${search}%`); i++ }
  if (role) { conditions.push(`role=$${i}`); params.push(role); i++ }
  if (status) { conditions.push(`status=$${i}`); params.push(status); i++ }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
  const countRes = await pool.query(`SELECT COUNT(*) FROM users ${where}`, params)
  const rows = await pool.query(
    `SELECT id,username,name,role,badge,station,status,last_login,created_at FROM users ${where} ORDER BY created_at DESC LIMIT $${i} OFFSET $${i+1}`,
    [...params, limit, offset]
  )
  respond(res, rows.rows, parseInt(countRes.rows[0].count), page, limit)
}

exports.getById = async (req, res) => {
  const r = await pool.query('SELECT id,username,name,role,badge,station,status,last_login,created_at FROM users WHERE id=$1', [req.params.id])
  if (!r.rowCount) return res.status(404).json({ error: 'User not found' })
  res.json({ success: true, data: r.rows[0] })
}

exports.create = async (req, res) => {
  if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Only Admin can create users' })
  const { username, password, name, role, badge, station, status } = req.body
  if (!username || !password || !name) return res.status(400).json({ error: 'Username, password and name are required' })
  try {
    const hash = await bcrypt.hash(password, 10)
    const r = await pool.query(
      `INSERT INTO users (username,password,name,role,badge,station,status) VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id,username,name,role,badge,station,status`,
      [username, hash, name, role||'Officer', badge, station, status||'Active']
    )
    await logActivity(req.user.id, `Created user ${username}`, 'Users')
    res.status(201).json({ success: true, data: r.rows[0] })
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Username already exists' })
    res.status(500).json({ error: err.message })
  }
}

exports.update = async (req, res) => {
  if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Only Admin can update users' })
  const { name, role, badge, station, status, password } = req.body
  try {
    let query, params
    if (password) {
      const hash = await bcrypt.hash(password, 10)
      query = `UPDATE users SET name=$1,role=$2,badge=$3,station=$4,status=$5,password=$6,updated_at=NOW() WHERE id=$7 RETURNING id,username,name,role,badge,station,status`
      params = [name, role, badge, station, status, hash, req.params.id]
    } else {
      query = `UPDATE users SET name=$1,role=$2,badge=$3,station=$4,status=$5,updated_at=NOW() WHERE id=$6 RETURNING id,username,name,role,badge,station,status`
      params = [name, role, badge, station, status, req.params.id]
    }
    const r = await pool.query(query, params)
    if (!r.rowCount) return res.status(404).json({ error: 'User not found' })
    res.json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.remove = async (req, res) => {
  if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Only Admin can delete' })
  if (parseInt(req.params.id) === req.user.id) return res.status(400).json({ error: 'Cannot delete your own account' })
  const r = await pool.query('DELETE FROM users WHERE id=$1', [req.params.id])
  if (!r.rowCount) return res.status(404).json({ error: 'User not found' })
  res.json({ success: true, message: 'User deleted' })
}
