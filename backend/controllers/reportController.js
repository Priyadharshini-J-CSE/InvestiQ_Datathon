const pool = require('../config/db')

exports.getSummary = async (req, res) => {
  try {
    const [firs, cases, criminals, arrests, convictions, charges, evidence, officers] = await Promise.all([
      pool.query(`SELECT status, COUNT(*) as count FROM firs GROUP BY status`),
      pool.query(`SELECT status, COUNT(*) as count FROM cases GROUP BY status`),
      pool.query(`SELECT risk_level, COUNT(*) as count FROM criminals GROUP BY risk_level`),
      pool.query(`SELECT custody_status, COUNT(*) as count FROM arrests GROUP BY custody_status`),
      pool.query(`SELECT appeal_status, COUNT(*) as count FROM convictions GROUP BY appeal_status`),
      pool.query(`SELECT status, COUNT(*) as count FROM charges GROUP BY status`),
      pool.query(`SELECT evidence_type, COUNT(*) as count FROM evidence GROUP BY evidence_type`),
      pool.query(`SELECT rank, COUNT(*) as count FROM officers WHERE status='Active' GROUP BY rank ORDER BY count DESC`),
    ])
    res.json({
      success: true,
      data: {
        firs: firs.rows,
        cases: cases.rows,
        criminals: criminals.rows,
        arrests: arrests.rows,
        convictions: convictions.rows,
        charges: charges.rows,
        evidence: evidence.rows,
        officers: officers.rows,
      }
    })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.getMonthly = async (req, res) => {
  const { year = new Date().getFullYear() } = req.query
  try {
    const [firs, arrests, convictions] = await Promise.all([
      pool.query(`SELECT TO_CHAR(date,'Mon') as month, EXTRACT(MONTH FROM date) as mon_num, COUNT(*) as count FROM firs WHERE EXTRACT(YEAR FROM date)=$1 GROUP BY month, mon_num ORDER BY mon_num`, [year]),
      pool.query(`SELECT TO_CHAR(arrest_date,'Mon') as month, EXTRACT(MONTH FROM arrest_date) as mon_num, COUNT(*) as count FROM arrests WHERE EXTRACT(YEAR FROM arrest_date)=$1 GROUP BY month, mon_num ORDER BY mon_num`, [year]),
      pool.query(`SELECT TO_CHAR(conviction_date,'Mon') as month, EXTRACT(MONTH FROM conviction_date) as mon_num, COUNT(*) as count FROM convictions WHERE EXTRACT(YEAR FROM conviction_date)=$1 GROUP BY month, mon_num ORDER BY mon_num`, [year]),
    ])
    res.json({ success: true, data: { firs: firs.rows, arrests: arrests.rows, convictions: convictions.rows } })
  } catch (err) { res.status(500).json({ error: err.message }) }
}
