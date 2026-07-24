const pool = require('../config/db')

const paginate = (page = 1, limit = 20) => {
  const p = Math.max(1, parseInt(page))
  const l = Math.min(100, Math.max(1, parseInt(limit)))
  return { limit: l, offset: (p - 1) * l, page: p }
}

const respond = (res, rows, total, page, limit) =>
  res.json({ success: true, data: rows, total, page, limit, pages: Math.ceil(total / limit) })

const logActivity = async (userId, description, module) => {
  try {
    await pool.query(
      'INSERT INTO activity_logs (user_id, description, module) VALUES ($1,$2,$3)',
      [userId, description, module]
    )
  } catch (_) {}
}

module.exports = { paginate, respond, logActivity }
