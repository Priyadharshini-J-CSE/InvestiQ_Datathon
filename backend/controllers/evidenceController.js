const pool = require('../config/db')
const { paginate, respond, logActivity } = require('../utils/helpers')

exports.getAll = async (req, res) => {
  const { page, limit, offset } = paginate(req.query.page, req.query.limit)
  const { search, case_id, evidence_type } = req.query
  const conditions = []; const params = []; let i = 1
  if (search) { conditions.push(`(e.description ILIKE $${i} OR e.location ILIKE $${i})`); params.push(`%${search}%`); i++ }
  if (case_id) { conditions.push(`e.case_id=$${i}`); params.push(case_id); i++ }
  if (evidence_type) { conditions.push(`e.evidence_type=$${i}`); params.push(evidence_type); i++ }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
  const countRes = await pool.query(`SELECT COUNT(*) FROM evidence e ${where}`, params)
  const rows = await pool.query(
    `SELECT e.*, ca.case_number, o.name as collected_by_name FROM evidence e
     LEFT JOIN cases ca ON e.case_id=ca.id LEFT JOIN officers o ON e.collected_by=o.id
     ${where} ORDER BY e.created_at DESC LIMIT $${i} OFFSET $${i+1}`,
    [...params, limit, offset]
  )
  respond(res, rows.rows, parseInt(countRes.rows[0].count), page, limit)
}

exports.getById = async (req, res) => {
  const r = await pool.query(
    `SELECT e.*, ca.case_number, o.name as collected_by_name FROM evidence e
     LEFT JOIN cases ca ON e.case_id=ca.id LEFT JOIN officers o ON e.collected_by=o.id WHERE e.id=$1`,
    [req.params.id]
  )
  if (!r.rowCount) return res.status(404).json({ error: 'Evidence not found' })
  res.json({ success: true, data: r.rows[0] })
}

exports.create = async (req, res) => {
  const { case_id, evidence_type, description, collected_by, collected_date, location, storage_location, file_url } = req.body
  if (!case_id || !evidence_type) return res.status(400).json({ error: 'Case and evidence type are required' })
  try {
    const r = await pool.query(
      `INSERT INTO evidence (case_id,evidence_type,description,collected_by,collected_date,location,storage_location,file_url,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [case_id, evidence_type, description, collected_by||null, collected_date||null, location, storage_location, file_url, req.user.id]
    )
    await logActivity(req.user.id, `Evidence added: ${evidence_type}`, 'Evidence')
    res.status(201).json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.update = async (req, res) => {
  const { case_id, evidence_type, description, collected_by, collected_date, location, storage_location, file_url, status } = req.body
  try {
    const r = await pool.query(
      `UPDATE evidence SET case_id=$1,evidence_type=$2,description=$3,collected_by=$4,collected_date=$5,location=$6,storage_location=$7,file_url=$8,status=$9,modified_by=$10,updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [case_id, evidence_type, description, collected_by||null, collected_date||null, location, storage_location, file_url, status||'Active', req.user.id, req.params.id]
    )
    if (!r.rowCount) return res.status(404).json({ error: 'Evidence not found' })
    res.json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.remove = async (req, res) => {
  if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Only Admin can delete' })
  const r = await pool.query('DELETE FROM evidence WHERE id=$1', [req.params.id])
  if (!r.rowCount) return res.status(404).json({ error: 'Evidence not found' })
  res.json({ success: true, message: 'Evidence deleted' })
}
