const pool = require('../config/db')
const { paginate, respond } = require('../utils/helpers')

// ── Generic helpers ────────────────────────────────────────────────────────────

const list = (table, orderCol = 'id') => async (req, res) => {
  try {
    const r = await pool.query(`SELECT * FROM ${table} ORDER BY ${orderCol}`)
    res.json({ success: true, data: r.rows })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

const getOne = (table) => async (req, res) => {
  try {
    const r = await pool.query(`SELECT * FROM ${table} WHERE id=$1`, [req.params.id])
    if (!r.rowCount) return res.status(404).json({ error: 'Record not found' })
    res.json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

const del = (table) => async (req, res) => {
  try {
    const r = await pool.query(`DELETE FROM ${table} WHERE id=$1 RETURNING id`, [req.params.id])
    if (!r.rowCount) return res.status(404).json({ error: 'Record not found' })
    res.json({ success: true, message: 'Deleted' })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

// ── State Master ───────────────────────────────────────────────────────────────

exports.getStates     = list('state_master', 'state_name')
exports.getState      = getOne('state_master')
exports.deleteState   = del('state_master')

exports.createState = async (req, res) => {
  const { state_name, country = 'India' } = req.body
  if (!state_name) return res.status(400).json({ error: 'state_name is required' })
  try {
    const r = await pool.query(
      'INSERT INTO state_master (state_name, country) VALUES ($1,$2) RETURNING *',
      [state_name, country]
    )
    res.status(201).json({ success: true, data: r.rows[0] })
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'State already exists' })
    res.status(500).json({ error: err.message })
  }
}

exports.updateState = async (req, res) => {
  const { state_name, country } = req.body
  try {
    const r = await pool.query(
      'UPDATE state_master SET state_name=$1, country=$2 WHERE id=$3 RETURNING *',
      [state_name, country, req.params.id]
    )
    if (!r.rowCount) return res.status(404).json({ error: 'Not found' })
    res.json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

// ── District Master ────────────────────────────────────────────────────────────

exports.getDistricts = async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT d.*, s.state_name FROM district_master d
       LEFT JOIN state_master s ON d.state_id=s.id ORDER BY d.district_name`
    )
    res.json({ success: true, data: r.rows })
  } catch (err) { res.status(500).json({ error: err.message }) }
}
exports.getDistrict    = getOne('district_master')
exports.deleteDistrict = del('district_master')

exports.createDistrict = async (req, res) => {
  const { district_name, state_id } = req.body
  if (!district_name) return res.status(400).json({ error: 'district_name is required' })
  try {
    const r = await pool.query(
      'INSERT INTO district_master (district_name, state_id) VALUES ($1,$2) RETURNING *',
      [district_name, state_id || null]
    )
    res.status(201).json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.updateDistrict = async (req, res) => {
  const { district_name, state_id } = req.body
  try {
    const r = await pool.query(
      'UPDATE district_master SET district_name=$1, state_id=$2 WHERE id=$3 RETURNING *',
      [district_name, state_id || null, req.params.id]
    )
    if (!r.rowCount) return res.status(404).json({ error: 'Not found' })
    res.json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

// ── Occupation Master ──────────────────────────────────────────────────────────

exports.getOccupations    = list('occupation_master', 'occupation_name')
exports.getOccupation     = getOne('occupation_master')
exports.deleteOccupation  = del('occupation_master')

exports.createOccupation = async (req, res) => {
  const { occupation_name } = req.body
  if (!occupation_name) return res.status(400).json({ error: 'occupation_name is required' })
  try {
    const r = await pool.query(
      'INSERT INTO occupation_master (occupation_name) VALUES ($1) RETURNING *', [occupation_name]
    )
    res.status(201).json({ success: true, data: r.rows[0] })
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Already exists' })
    res.status(500).json({ error: err.message })
  }
}

exports.updateOccupation = async (req, res) => {
  const { occupation_name } = req.body
  try {
    const r = await pool.query(
      'UPDATE occupation_master SET occupation_name=$1 WHERE id=$2 RETURNING *',
      [occupation_name, req.params.id]
    )
    if (!r.rowCount) return res.status(404).json({ error: 'Not found' })
    res.json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

// ── Religion Master ────────────────────────────────────────────────────────────

exports.getReligions    = list('religion_master', 'religion_name')
exports.getReligion     = getOne('religion_master')
exports.deleteReligion  = del('religion_master')

exports.createReligion = async (req, res) => {
  const { religion_name } = req.body
  if (!religion_name) return res.status(400).json({ error: 'religion_name is required' })
  try {
    const r = await pool.query(
      'INSERT INTO religion_master (religion_name) VALUES ($1) RETURNING *', [religion_name]
    )
    res.status(201).json({ success: true, data: r.rows[0] })
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Already exists' })
    res.status(500).json({ error: err.message })
  }
}

exports.updateReligion = async (req, res) => {
  const { religion_name } = req.body
  try {
    const r = await pool.query(
      'UPDATE religion_master SET religion_name=$1 WHERE id=$2 RETURNING *',
      [religion_name, req.params.id]
    )
    if (!r.rowCount) return res.status(404).json({ error: 'Not found' })
    res.json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

// ── Caste Master ───────────────────────────────────────────────────────────────

exports.getCastes    = list('caste_master', 'caste_name')
exports.getCaste     = getOne('caste_master')
exports.deleteCaste  = del('caste_master')

exports.createCaste = async (req, res) => {
  const { caste_name } = req.body
  if (!caste_name) return res.status(400).json({ error: 'caste_name is required' })
  try {
    const r = await pool.query(
      'INSERT INTO caste_master (caste_name) VALUES ($1) RETURNING *', [caste_name]
    )
    res.status(201).json({ success: true, data: r.rows[0] })
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Already exists' })
    res.status(500).json({ error: err.message })
  }
}

exports.updateCaste = async (req, res) => {
  const { caste_name } = req.body
  try {
    const r = await pool.query(
      'UPDATE caste_master SET caste_name=$1 WHERE id=$2 RETURNING *',
      [caste_name, req.params.id]
    )
    if (!r.rowCount) return res.status(404).json({ error: 'Not found' })
    res.json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

// ── Ranks ──────────────────────────────────────────────────────────────────────

exports.getRanks    = list('ranks', 'hierarchy')
exports.getRank     = getOne('ranks')
exports.deleteRank  = del('ranks')

exports.createRank = async (req, res) => {
  const { rank_name, hierarchy } = req.body
  if (!rank_name) return res.status(400).json({ error: 'rank_name is required' })
  try {
    const r = await pool.query(
      'INSERT INTO ranks (rank_name, hierarchy) VALUES ($1,$2) RETURNING *',
      [rank_name, hierarchy || 0]
    )
    res.status(201).json({ success: true, data: r.rows[0] })
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Rank already exists' })
    res.status(500).json({ error: err.message })
  }
}

exports.updateRank = async (req, res) => {
  const { rank_name, hierarchy } = req.body
  try {
    const r = await pool.query(
      'UPDATE ranks SET rank_name=$1, hierarchy=$2 WHERE id=$3 RETURNING *',
      [rank_name, hierarchy || 0, req.params.id]
    )
    if (!r.rowCount) return res.status(404).json({ error: 'Not found' })
    res.json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

// ── Designations ───────────────────────────────────────────────────────────────

exports.getDesignations    = list('designations', 'designation_name')
exports.getDesignation     = getOne('designations')
exports.deleteDesignation  = del('designations')

exports.createDesignation = async (req, res) => {
  const { designation_name } = req.body
  if (!designation_name) return res.status(400).json({ error: 'designation_name is required' })
  try {
    const r = await pool.query(
      'INSERT INTO designations (designation_name) VALUES ($1) RETURNING *', [designation_name]
    )
    res.status(201).json({ success: true, data: r.rows[0] })
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Already exists' })
    res.status(500).json({ error: err.message })
  }
}

exports.updateDesignation = async (req, res) => {
  const { designation_name } = req.body
  try {
    const r = await pool.query(
      'UPDATE designations SET designation_name=$1 WHERE id=$2 RETURNING *',
      [designation_name, req.params.id]
    )
    if (!r.rowCount) return res.status(404).json({ error: 'Not found' })
    res.json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

// ── Police Units ───────────────────────────────────────────────────────────────

exports.getPoliceUnits = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query.page, req.query.limit)
    const { search, type } = req.query
    const conditions = []; const params = []; let i = 1
    if (search) { conditions.push(`(u.unit_name ILIKE $${i} OR u.district ILIKE $${i})`); params.push(`%${search}%`); i++ }
    if (type) { conditions.push(`u.type=$${i}`); params.push(type); i++ }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
    const countRes = await pool.query(`SELECT COUNT(*) FROM police_units u ${where}`, params)
    const rows = await pool.query(
      `SELECT u.*, p.unit_name as parent_name FROM police_units u
       LEFT JOIN police_units p ON u.parent_unit=p.id
       ${where} ORDER BY u.unit_name LIMIT $${i} OFFSET $${i+1}`,
      [...params, limit, offset]
    )
    respond(res, rows.rows, parseInt(countRes.rows[0].count), page, limit)
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.getPoliceUnit    = getOne('police_units')
exports.deletePoliceUnit = del('police_units')

exports.createPoliceUnit = async (req, res) => {
  const { unit_name, district, state, type, parent_unit } = req.body
  if (!unit_name) return res.status(400).json({ error: 'unit_name is required' })
  try {
    const r = await pool.query(
      'INSERT INTO police_units (unit_name, district, state, type, parent_unit) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [unit_name, district, state, type, parent_unit || null]
    )
    res.status(201).json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.updatePoliceUnit = async (req, res) => {
  const { unit_name, district, state, type, parent_unit } = req.body
  try {
    const r = await pool.query(
      'UPDATE police_units SET unit_name=$1, district=$2, state=$3, type=$4, parent_unit=$5, updated_at=NOW() WHERE id=$6 RETURNING *',
      [unit_name, district, state, type, parent_unit || null, req.params.id]
    )
    if (!r.rowCount) return res.status(404).json({ error: 'Not found' })
    res.json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

// ── Courts ─────────────────────────────────────────────────────────────────────

exports.getCourts = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query.page, req.query.limit)
    const { search, court_type } = req.query
    const conditions = []; const params = []; let i = 1
    if (search) { conditions.push(`(c.court_name ILIKE $${i} OR c.district ILIKE $${i})`); params.push(`%${search}%`); i++ }
    if (court_type) { conditions.push(`c.court_type=$${i}`); params.push(court_type); i++ }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
    const countRes = await pool.query(`SELECT COUNT(*) FROM courts c ${where}`, params)
    const rows = await pool.query(
      `SELECT * FROM courts c ${where} ORDER BY c.court_name LIMIT $${i} OFFSET $${i+1}`,
      [...params, limit, offset]
    )
    respond(res, rows.rows, parseInt(countRes.rows[0].count), page, limit)
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.getCourt    = getOne('courts')
exports.deleteCourt = del('courts')

exports.createCourt = async (req, res) => {
  const { court_name, district, state, court_type } = req.body
  if (!court_name) return res.status(400).json({ error: 'court_name is required' })
  try {
    const r = await pool.query(
      'INSERT INTO courts (court_name, district, state, court_type) VALUES ($1,$2,$3,$4) RETURNING *',
      [court_name, district, state, court_type]
    )
    res.status(201).json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.updateCourt = async (req, res) => {
  const { court_name, district, state, court_type } = req.body
  try {
    const r = await pool.query(
      'UPDATE courts SET court_name=$1, district=$2, state=$3, court_type=$4, updated_at=NOW() WHERE id=$5 RETURNING *',
      [court_name, district, state, court_type, req.params.id]
    )
    if (!r.rowCount) return res.status(404).json({ error: 'Not found' })
    res.json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

// ── Act Master ─────────────────────────────────────────────────────────────────

exports.getActs = async (req, res) => {
  try {
    const { search } = req.query
    const conditions = []; const params = []; let i = 1
    if (search) { conditions.push(`(act_name ILIKE $${i} OR short_name ILIKE $${i})`); params.push(`%${search}%`); i++ }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
    const r = await pool.query(`SELECT * FROM act_master ${where} ORDER BY act_name`, params)
    res.json({ success: true, data: r.rows })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.getAct    = getOne('act_master')
exports.deleteAct = del('act_master')

exports.createAct = async (req, res) => {
  const { act_name, short_name, description, active = true } = req.body
  if (!act_name) return res.status(400).json({ error: 'act_name is required' })
  try {
    const r = await pool.query(
      'INSERT INTO act_master (act_name, short_name, description, active) VALUES ($1,$2,$3,$4) RETURNING *',
      [act_name, short_name, description, active]
    )
    res.status(201).json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.updateAct = async (req, res) => {
  const { act_name, short_name, description, active } = req.body
  try {
    const r = await pool.query(
      'UPDATE act_master SET act_name=$1, short_name=$2, description=$3, active=$4, updated_at=NOW() WHERE id=$5 RETURNING *',
      [act_name, short_name, description, active, req.params.id]
    )
    if (!r.rowCount) return res.status(404).json({ error: 'Not found' })
    res.json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

// ── Section Master ─────────────────────────────────────────────────────────────

exports.getSections = async (req, res) => {
  try {
    const { act_id, search } = req.query
    const conditions = []; const params = []; let i = 1
    if (act_id) { conditions.push(`s.act_id=$${i}`); params.push(act_id); i++ }
    if (search) { conditions.push(`(s.section_code ILIKE $${i} OR s.section_name ILIKE $${i})`); params.push(`%${search}%`); i++ }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
    const r = await pool.query(
      `SELECT s.*, a.act_name, a.short_name FROM section_master s
       LEFT JOIN act_master a ON s.act_id=a.id
       ${where} ORDER BY s.section_code`,
      params
    )
    res.json({ success: true, data: r.rows })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.getSection    = getOne('section_master')
exports.deleteSection = del('section_master')

exports.createSection = async (req, res) => {
  const { act_id, section_code, section_name, description, active = true } = req.body
  if (!section_code) return res.status(400).json({ error: 'section_code is required' })
  try {
    const r = await pool.query(
      'INSERT INTO section_master (act_id, section_code, section_name, description, active) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [act_id || null, section_code, section_name, description, active]
    )
    res.status(201).json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.updateSection = async (req, res) => {
  const { act_id, section_code, section_name, description, active } = req.body
  try {
    const r = await pool.query(
      'UPDATE section_master SET act_id=$1, section_code=$2, section_name=$3, description=$4, active=$5, updated_at=NOW() WHERE id=$6 RETURNING *',
      [act_id || null, section_code, section_name, description, active, req.params.id]
    )
    if (!r.rowCount) return res.status(404).json({ error: 'Not found' })
    res.json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

// ── Crime Head ─────────────────────────────────────────────────────────────────

exports.getCrimeHeads = async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT ch.*, json_agg(json_build_object('id', cs.id, 'subhead_name', cs.subhead_name)
         ORDER BY cs.subhead_name) FILTER (WHERE cs.id IS NOT NULL) as subheads
       FROM crime_head ch
       LEFT JOIN crime_subhead cs ON cs.crime_head_id=ch.id
       GROUP BY ch.id ORDER BY ch.crime_group`
    )
    res.json({ success: true, data: r.rows })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.getCrimeHead    = getOne('crime_head')
exports.deleteCrimeHead = del('crime_head')

exports.createCrimeHead = async (req, res) => {
  const { crime_group, description } = req.body
  if (!crime_group) return res.status(400).json({ error: 'crime_group is required' })
  try {
    const r = await pool.query(
      'INSERT INTO crime_head (crime_group, description) VALUES ($1,$2) RETURNING *',
      [crime_group, description]
    )
    res.status(201).json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.updateCrimeHead = async (req, res) => {
  const { crime_group, description } = req.body
  try {
    const r = await pool.query(
      'UPDATE crime_head SET crime_group=$1, description=$2 WHERE id=$3 RETURNING *',
      [crime_group, description, req.params.id]
    )
    if (!r.rowCount) return res.status(404).json({ error: 'Not found' })
    res.json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

// ── Crime Subhead ──────────────────────────────────────────────────────────────

exports.getCrimeSubheads = async (req, res) => {
  try {
    const { crime_head_id } = req.query
    const conditions = crime_head_id ? ['cs.crime_head_id=$1'] : []
    const params = crime_head_id ? [crime_head_id] : []
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
    const r = await pool.query(
      `SELECT cs.*, ch.crime_group FROM crime_subhead cs
       LEFT JOIN crime_head ch ON cs.crime_head_id=ch.id
       ${where} ORDER BY cs.subhead_name`,
      params
    )
    res.json({ success: true, data: r.rows })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.getCrimeSubhead    = getOne('crime_subhead')
exports.deleteCrimeSubhead = del('crime_subhead')

exports.createCrimeSubhead = async (req, res) => {
  const { crime_head_id, subhead_name } = req.body
  if (!subhead_name) return res.status(400).json({ error: 'subhead_name is required' })
  try {
    const r = await pool.query(
      'INSERT INTO crime_subhead (crime_head_id, subhead_name) VALUES ($1,$2) RETURNING *',
      [crime_head_id || null, subhead_name]
    )
    res.status(201).json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.updateCrimeSubhead = async (req, res) => {
  const { crime_head_id, subhead_name } = req.body
  try {
    const r = await pool.query(
      'UPDATE crime_subhead SET crime_head_id=$1, subhead_name=$2 WHERE id=$3 RETURNING *',
      [crime_head_id || null, subhead_name, req.params.id]
    )
    if (!r.rowCount) return res.status(404).json({ error: 'Not found' })
    res.json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

// ── Case Status Master ─────────────────────────────────────────────────────────

exports.getCaseStatuses    = list('case_status_master', 'status_name')
exports.getCaseStatus      = getOne('case_status_master')
exports.deleteCaseStatus   = del('case_status_master')

exports.createCaseStatus = async (req, res) => {
  const { status_name, description } = req.body
  if (!status_name) return res.status(400).json({ error: 'status_name is required' })
  try {
    const r = await pool.query(
      'INSERT INTO case_status_master (status_name, description) VALUES ($1,$2) RETURNING *',
      [status_name, description]
    )
    res.status(201).json({ success: true, data: r.rows[0] })
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Status already exists' })
    res.status(500).json({ error: err.message })
  }
}

exports.updateCaseStatus = async (req, res) => {
  const { status_name, description } = req.body
  try {
    const r = await pool.query(
      'UPDATE case_status_master SET status_name=$1, description=$2 WHERE id=$3 RETURNING *',
      [status_name, description, req.params.id]
    )
    if (!r.rowCount) return res.status(404).json({ error: 'Not found' })
    res.json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
}
