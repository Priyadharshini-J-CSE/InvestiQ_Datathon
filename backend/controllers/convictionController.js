const pool = require('../config/db')
const { paginate, respond, logActivity } = require('../utils/helpers')

exports.getAll = async (req, res) => {
  const { page, limit, offset } = paginate(req.query.page, req.query.limit)
  const { search, appeal_status } = req.query
  const conditions = []; const params = []; let i = 1
  if (search) { conditions.push(`(cv.court ILIKE $${i} OR cv.judge ILIKE $${i} OR cr.name ILIKE $${i})`); params.push(`%${search}%`); i++ }
  if (appeal_status) { conditions.push(`cv.appeal_status=$${i}`); params.push(appeal_status); i++ }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
  const countRes = await pool.query(`SELECT COUNT(*) FROM convictions cv LEFT JOIN criminals cr ON cv.criminal_id=cr.id ${where}`, params)
  const rows = await pool.query(
    `SELECT cv.*, cr.name as criminal_name, ca.case_number FROM convictions cv
     LEFT JOIN criminals cr ON cv.criminal_id=cr.id LEFT JOIN cases ca ON cv.case_id=ca.id
     ${where} ORDER BY cv.created_at DESC LIMIT $${i} OFFSET $${i+1}`,
    [...params, limit, offset]
  )
  respond(res, rows.rows, parseInt(countRes.rows[0].count), page, limit)
}

exports.getById = async (req, res) => {
  const r = await pool.query(
    `SELECT cv.*, cr.name as criminal_name, ca.case_number FROM convictions cv
     LEFT JOIN criminals cr ON cv.criminal_id=cr.id LEFT JOIN cases ca ON cv.case_id=ca.id WHERE cv.id=$1`,
    [req.params.id]
  )
  if (!r.rowCount) return res.status(404).json({ error: 'Conviction not found' })
  res.json({ success: true, data: r.rows[0] })
}

exports.create = async (req, res) => {
  const { case_id, criminal_id, court, judge, sentence, fine, prison, conviction_date, release_date, appeal_status } = req.body
  if (!case_id) return res.status(400).json({ error: 'Case is required' })
  try {
    const r = await pool.query(
      `INSERT INTO convictions (case_id,criminal_id,court,judge,sentence,fine,prison,conviction_date,release_date,appeal_status,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [case_id, criminal_id||null, court, judge, sentence, fine||null, prison, conviction_date||null, release_date||null, appeal_status||'None', req.user.id]
    )
    await logActivity(req.user.id, `Conviction recorded`, 'Convictions')
    res.status(201).json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.update = async (req, res) => {
  const { case_id, criminal_id, court, judge, sentence, fine, prison, conviction_date, release_date, appeal_status } = req.body
  try {
    const r = await pool.query(
      `UPDATE convictions SET case_id=$1,criminal_id=$2,court=$3,judge=$4,sentence=$5,fine=$6,prison=$7,conviction_date=$8,release_date=$9,appeal_status=$10,modified_by=$11,updated_at=NOW()
       WHERE id=$12 RETURNING *`,
      [case_id, criminal_id||null, court, judge, sentence, fine||null, prison, conviction_date||null, release_date||null, appeal_status, req.user.id, req.params.id]
    )
    if (!r.rowCount) return res.status(404).json({ error: 'Conviction not found' })
    res.json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.remove = async (req, res) => {
  if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Only Admin can delete' })
  const r = await pool.query('DELETE FROM convictions WHERE id=$1', [req.params.id])
  if (!r.rowCount) return res.status(404).json({ error: 'Conviction not found' })
  res.json({ success: true, message: 'Conviction deleted' })
}
