const pool = require('../config/db')

exports.getStats = async (req, res) => {
  try {
    const [firs, cases, criminals, wanted, arrests, convictions, officers, stations, activity,
           victims, complainants, accused, chargesheets, policeUnits, courts, crimeHeads, sections] =
      await Promise.all([
        pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status=\'Open\') as open, COUNT(*) FILTER (WHERE status=\'Closed\') as closed FROM firs'),
        pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status=\'Open\') as open, COUNT(*) FILTER (WHERE status=\'Closed\') as closed FROM cases'),
        pool.query('SELECT COUNT(*) FROM criminals'),
        pool.query('SELECT COUNT(*) FROM wanted WHERE status=\'Active\''),
        pool.query('SELECT COUNT(*) FROM arrests'),
        pool.query('SELECT COUNT(*) FROM convictions'),
        pool.query('SELECT COUNT(*) FROM officers WHERE status=\'Active\''),
        pool.query('SELECT COUNT(*) FROM police_stations'),
        pool.query('SELECT al.description, al.module, al.created_at, u.name as user_name FROM activity_logs al LEFT JOIN users u ON al.user_id=u.id ORDER BY al.created_at DESC LIMIT 10'),
        pool.query('SELECT COUNT(*) FROM victims').catch(() => ({ rows: [{ count: 0 }] })),
        pool.query('SELECT COUNT(*) FROM complainants').catch(() => ({ rows: [{ count: 0 }] })),
        pool.query('SELECT COUNT(*) FROM accused').catch(() => ({ rows: [{ count: 0 }] })),
        pool.query('SELECT COUNT(*) FROM chargesheet').catch(() => ({ rows: [{ count: 0 }] })),
        pool.query('SELECT COUNT(*) FROM police_units').catch(() => ({ rows: [{ count: 0 }] })),
        pool.query('SELECT COUNT(*) FROM courts').catch(() => ({ rows: [{ count: 0 }] })),
        pool.query('SELECT COUNT(*) FROM crime_head').catch(() => ({ rows: [{ count: 0 }] })),
        pool.query('SELECT COUNT(*) FROM section_master').catch(() => ({ rows: [{ count: 0 }] })),
      ])
    res.json({
      success: true,
      data: {
        totalFIRs: parseInt(firs.rows[0].total),
        openFIRs: parseInt(firs.rows[0].open),
        closedFIRs: parseInt(firs.rows[0].closed),
        totalCases: parseInt(cases.rows[0].total),
        openCases: parseInt(cases.rows[0].open),
        closedCases: parseInt(cases.rows[0].closed),
        totalCriminals: parseInt(criminals.rows[0].count),
        wantedCriminals: parseInt(wanted.rows[0].count),
        totalArrests: parseInt(arrests.rows[0].count),
        totalConvictions: parseInt(convictions.rows[0].count),
        activeOfficers: parseInt(officers.rows[0].count),
        policeStations: parseInt(stations.rows[0].count),
        recentActivity: activity.rows,
        totalVictims: parseInt(victims.rows[0].count),
        totalComplainants: parseInt(complainants.rows[0].count),
        totalAccused: parseInt(accused.rows[0].count),
        totalChargesheets: parseInt(chargesheets.rows[0].count),
        totalPoliceUnits: parseInt(policeUnits.rows[0].count),
        totalCourts: parseInt(courts.rows[0].count),
        totalCrimeHeads: parseInt(crimeHeads.rows[0].count),
        totalSections: parseInt(sections.rows[0].count),
      }
    })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.getAnalytics = async (req, res) => {
  try {
    const [monthly, byDistrict, byCategory, arrests, convictions] = await Promise.all([
      pool.query(`SELECT TO_CHAR(date,'Mon') as month, EXTRACT(MONTH FROM date) as mon_num, COUNT(*) as firs FROM firs WHERE date >= NOW() - INTERVAL '12 months' GROUP BY month, mon_num ORDER BY mon_num`),
      pool.query(`SELECT district, COUNT(*) as cases FROM firs WHERE district IS NOT NULL GROUP BY district ORDER BY cases DESC LIMIT 10`),
      pool.query(`SELECT crime_type as category, COUNT(*) as count FROM firs WHERE crime_type IS NOT NULL GROUP BY crime_type ORDER BY count DESC LIMIT 8`),
      pool.query(`SELECT TO_CHAR(arrest_date,'Mon') as month, EXTRACT(MONTH FROM arrest_date) as mon_num, COUNT(*) as count FROM arrests WHERE arrest_date >= NOW() - INTERVAL '12 months' GROUP BY month, mon_num ORDER BY mon_num`),
      pool.query(`SELECT TO_CHAR(conviction_date,'Mon') as month, EXTRACT(MONTH FROM conviction_date) as mon_num, COUNT(*) as count FROM convictions WHERE conviction_date >= NOW() - INTERVAL '12 months' GROUP BY month, mon_num ORDER BY mon_num`),
    ])
    res.json({ success: true, data: { monthly: monthly.rows, byDistrict: byDistrict.rows, byCategory: byCategory.rows, arrests: arrests.rows, convictions: convictions.rows } })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.getHeatmap = async (req, res) => {
  try {
    const r = await pool.query(`SELECT district, crime_type, COUNT(*) as count FROM firs WHERE district IS NOT NULL GROUP BY district, crime_type ORDER BY count DESC`)
    res.json({ success: true, data: r.rows })
  } catch (err) { res.status(500).json({ error: err.message }) }
}
