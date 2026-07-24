const pool = require('../config/db')

exports.getFIRDetail = async (req, res) => {
  const { id } = req.params
  try {
    const [fir, complainants, victims, accused, charges, evidence, arrests, chargesheets] =
      await Promise.all([
        pool.query(
          `SELECT f.*, o.name as officer_name, ps.name as station_name
           FROM firs f
           LEFT JOIN officers o ON f.officer_id=o.id
           LEFT JOIN police_stations ps ON f.station_id=ps.id
           WHERE f.id=$1`,
          [id]
        ),
        pool.query('SELECT * FROM complainants WHERE fir_id=$1 ORDER BY id', [id]),
        pool.query('SELECT * FROM victims WHERE fir_id=$1 ORDER BY id', [id]),
        pool.query(
          `SELECT a.*, c.criminal_id as criminal_ref, c.risk_level
           FROM accused a LEFT JOIN criminals c ON a.criminal_id=c.id
           WHERE a.fir_id=$1 ORDER BY a.id`,
          [id]
        ),
        pool.query(
          `SELECT ch.*, ca.case_number
           FROM charges ch LEFT JOIN cases ca ON ch.case_id=ca.id
           WHERE ca.fir_id=$1 ORDER BY ch.id`,
          [id]
        ),
        pool.query(
          `SELECT ev.*, o.name as collected_by_name
           FROM evidence ev
           LEFT JOIN cases ca ON ev.case_id=ca.id
           LEFT JOIN officers o ON ev.collected_by=o.id
           WHERE ca.fir_id=$1 ORDER BY ev.id`,
          [id]
        ),
        pool.query(
          `SELECT ar.*, c.name as criminal_name, o.name as officer_name
           FROM arrests ar
           LEFT JOIN criminals c ON ar.criminal_id=c.id
           LEFT JOIN officers o ON ar.officer_id=o.id
           WHERE ar.criminal_id IN (
             SELECT criminal_id FROM accused WHERE fir_id=$1 AND criminal_id IS NOT NULL
           ) ORDER BY ar.arrest_date DESC`,
          [id]
        ),
        pool.query(
          `SELECT cs.*, u.name as created_by_name
           FROM chargesheet cs LEFT JOIN users u ON cs.created_by=u.id
           WHERE cs.fir_id=$1 ORDER BY cs.id`,
          [id]
        ),
      ])

    if (!fir.rowCount) return res.status(404).json({ error: 'FIR not found' })

    res.json({
      success: true,
      data: {
        fir: fir.rows[0],
        complainants: complainants.rows,
        victims: victims.rows,
        accused: accused.rows,
        charges: charges.rows,
        evidence: evidence.rows,
        arrests: arrests.rows,
        chargesheets: chargesheets.rows,
      }
    })
  } catch (err) {
    console.error('[firDetailController]', err.message)
    res.status(500).json({ error: err.message })
  }
}
