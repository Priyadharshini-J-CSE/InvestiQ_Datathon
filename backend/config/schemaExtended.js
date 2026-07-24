const pool = require('./db')

async function createExtendedSchema() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // 1. state_master
    await client.query(`
      CREATE TABLE IF NOT EXISTS state_master (
        id SERIAL PRIMARY KEY,
        state_name VARCHAR(100) UNIQUE NOT NULL,
        country VARCHAR(100) DEFAULT 'India',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // 2. district_master
    await client.query(`
      CREATE TABLE IF NOT EXISTS district_master (
        id SERIAL PRIMARY KEY,
        district_name VARCHAR(100) NOT NULL,
        state_id INTEGER REFERENCES state_master(id),
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(district_name, state_id)
      )
    `)

    // 3. occupation_master
    await client.query(`
      CREATE TABLE IF NOT EXISTS occupation_master (
        id SERIAL PRIMARY KEY,
        occupation_name VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // 4. religion_master
    await client.query(`
      CREATE TABLE IF NOT EXISTS religion_master (
        id SERIAL PRIMARY KEY,
        religion_name VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // 5. caste_master
    await client.query(`
      CREATE TABLE IF NOT EXISTS caste_master (
        id SERIAL PRIMARY KEY,
        caste_name VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // 6. ranks
    await client.query(`
      CREATE TABLE IF NOT EXISTS ranks (
        id SERIAL PRIMARY KEY,
        rank_name VARCHAR(100) UNIQUE NOT NULL,
        hierarchy INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // 7. designations
    await client.query(`
      CREATE TABLE IF NOT EXISTS designations (
        id SERIAL PRIMARY KEY,
        designation_name VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // 8. police_units
    await client.query(`
      CREATE TABLE IF NOT EXISTS police_units (
        id SERIAL PRIMARY KEY,
        unit_name VARCHAR(150) NOT NULL,
        district VARCHAR(100),
        state VARCHAR(100),
        type VARCHAR(50),
        parent_unit INTEGER REFERENCES police_units(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // 9. courts
    await client.query(`
      CREATE TABLE IF NOT EXISTS courts (
        id SERIAL PRIMARY KEY,
        court_name VARCHAR(150) NOT NULL,
        district VARCHAR(100),
        state VARCHAR(100),
        court_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // 10. act_master
    await client.query(`
      CREATE TABLE IF NOT EXISTS act_master (
        id SERIAL PRIMARY KEY,
        act_name VARCHAR(200) NOT NULL,
        short_name VARCHAR(50),
        description TEXT,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // 11. section_master
    await client.query(`
      CREATE TABLE IF NOT EXISTS section_master (
        id SERIAL PRIMARY KEY,
        act_id INTEGER REFERENCES act_master(id) ON DELETE CASCADE,
        section_code VARCHAR(50) NOT NULL,
        section_name VARCHAR(200),
        description TEXT,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // 12. crime_head
    await client.query(`
      CREATE TABLE IF NOT EXISTS crime_head (
        id SERIAL PRIMARY KEY,
        crime_group VARCHAR(150) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // 13. crime_subhead
    await client.query(`
      CREATE TABLE IF NOT EXISTS crime_subhead (
        id SERIAL PRIMARY KEY,
        crime_head_id INTEGER REFERENCES crime_head(id) ON DELETE CASCADE,
        subhead_name VARCHAR(150) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // 14. case_status_master
    await client.query(`
      CREATE TABLE IF NOT EXISTS case_status_master (
        id SERIAL PRIMARY KEY,
        status_name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // 15. complainants
    await client.query(`
      CREATE TABLE IF NOT EXISTS complainants (
        id SERIAL PRIMARY KEY,
        fir_id INTEGER REFERENCES firs(id) ON DELETE CASCADE,
        full_name VARCHAR(150) NOT NULL,
        age INTEGER,
        gender VARCHAR(10),
        occupation VARCHAR(100),
        religion VARCHAR(100),
        caste VARCHAR(100),
        mobile VARCHAR(20),
        address TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_by INTEGER REFERENCES users(id)
      )
    `)

    // 16. victims
    await client.query(`
      CREATE TABLE IF NOT EXISTS victims (
        id SERIAL PRIMARY KEY,
        fir_id INTEGER REFERENCES firs(id) ON DELETE CASCADE,
        person_id INTEGER REFERENCES persons(id),
        victim_name VARCHAR(150) NOT NULL,
        age INTEGER,
        gender VARCHAR(10),
        victim_type VARCHAR(100),
        injury_type VARCHAR(100),
        hospital VARCHAR(150),
        remarks TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_by INTEGER REFERENCES users(id)
      )
    `)

    // 17. accused
    await client.query(`
      CREATE TABLE IF NOT EXISTS accused (
        id SERIAL PRIMARY KEY,
        fir_id INTEGER REFERENCES firs(id) ON DELETE CASCADE,
        criminal_id INTEGER REFERENCES criminals(id),
        accused_name VARCHAR(150) NOT NULL,
        age INTEGER,
        gender VARCHAR(10),
        alias VARCHAR(100),
        status VARCHAR(50) DEFAULT 'Under Investigation',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_by INTEGER REFERENCES users(id)
      )
    `)

    // 18. act_section_mapping
    await client.query(`
      CREATE TABLE IF NOT EXISTS act_section_mapping (
        id SERIAL PRIMARY KEY,
        fir_id INTEGER REFERENCES firs(id) ON DELETE CASCADE,
        act_id INTEGER REFERENCES act_master(id),
        section_id INTEGER REFERENCES section_master(id),
        sequence INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // 19. chargesheet
    await client.query(`
      CREATE TABLE IF NOT EXISTS chargesheet (
        id SERIAL PRIMARY KEY,
        fir_id INTEGER REFERENCES firs(id) ON DELETE CASCADE,
        chargesheet_date DATE,
        chargesheet_type VARCHAR(100),
        filed_by VARCHAR(150),
        status VARCHAR(50) DEFAULT 'Draft',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_by INTEGER REFERENCES users(id)
      )
    `)

    await client.query('COMMIT')
    console.log('[ExtendedSchema] All 19 new tables created successfully')

    // Seed master data
    await seedMasterData()

  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[ExtendedSchema] Error:', err.message)
  } finally {
    client.release()
  }
}

async function seedMasterData() {
  // States
  const states = ['Tamil Nadu', 'Karnataka', 'Kerala', 'Andhra Pradesh', 'Telangana']
  for (const s of states) {
    await pool.query('INSERT INTO state_master (state_name) VALUES ($1) ON CONFLICT (state_name) DO NOTHING', [s])
  }

  // Occupations
  const occupations = ['Student', 'Farmer', 'Business', 'Government Employee', 'Private Employee', 'Daily Wage', 'Unemployed', 'Teacher', 'Doctor', 'Lawyer', 'Other']
  for (const o of occupations) {
    await pool.query('INSERT INTO occupation_master (occupation_name) VALUES ($1) ON CONFLICT (occupation_name) DO NOTHING', [o])
  }

  // Religions
  const religions = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'Other']
  for (const r of religions) {
    await pool.query('INSERT INTO religion_master (religion_name) VALUES ($1) ON CONFLICT (religion_name) DO NOTHING', [r])
  }

  // Ranks
  const ranks = [
    { name: 'Director General of Police', h: 1 }, { name: 'Additional DGP', h: 2 },
    { name: 'Inspector General', h: 3 }, { name: 'Deputy Inspector General', h: 4 },
    { name: 'Superintendent of Police', h: 5 }, { name: 'Additional SP', h: 6 },
    { name: 'Deputy SP', h: 7 }, { name: 'Inspector', h: 8 },
    { name: 'Sub Inspector', h: 9 }, { name: 'Assistant Sub Inspector', h: 10 },
    { name: 'Head Constable', h: 11 }, { name: 'Constable', h: 12 },
  ]
  for (const r of ranks) {
    await pool.query('INSERT INTO ranks (rank_name, hierarchy) VALUES ($1,$2) ON CONFLICT (rank_name) DO NOTHING', [r.name, r.h])
  }

  // Acts
  const acts = [
    { name: 'Indian Penal Code', short: 'IPC', desc: 'Main criminal code of India' },
    { name: 'Code of Criminal Procedure', short: 'CrPC', desc: 'Procedural law for criminal matters' },
    { name: 'Narcotic Drugs and Psychotropic Substances Act', short: 'NDPS', desc: 'Drug related offences' },
    { name: 'Prevention of Corruption Act', short: 'PCA', desc: 'Anti-corruption law' },
    { name: 'Information Technology Act', short: 'IT Act', desc: 'Cyber crime law' },
  ]
  for (const a of acts) {
    await pool.query(
      'INSERT INTO act_master (act_name, short_name, description) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
      [a.name, a.short, a.desc]
    )
  }

  // IPC sections
  const ipcRes = await pool.query("SELECT id FROM act_master WHERE short_name='IPC' LIMIT 1")
  if (ipcRes.rowCount) {
    const actId = ipcRes.rows[0].id
    const sections = [
      { code: '302', name: 'Murder' }, { code: '307', name: 'Attempt to Murder' },
      { code: '376', name: 'Rape' }, { code: '379', name: 'Theft' },
      { code: '380', name: 'Theft in dwelling house' }, { code: '392', name: 'Robbery' },
      { code: '395', name: 'Dacoity' }, { code: '420', name: 'Cheating' },
      { code: '498A', name: 'Cruelty by husband' }, { code: '304B', name: 'Dowry Death' },
    ]
    for (const s of sections) {
      await pool.query(
        'INSERT INTO section_master (act_id, section_code, section_name) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
        [actId, s.code, s.name]
      )
    }
  }

  // Crime heads
  const crimeHeads = [
    { group: 'Crimes Against Body', subs: ['Murder', 'Attempt to Murder', 'Assault', 'Kidnapping'] },
    { group: 'Crimes Against Property', subs: ['Theft', 'Robbery', 'Dacoity', 'Burglary', 'Fraud'] },
    { group: 'Crimes Against Women', subs: ['Rape', 'Dowry Death', 'Domestic Violence', 'Eve Teasing'] },
    { group: 'Cyber Crimes', subs: ['Online Fraud', 'Hacking', 'Identity Theft', 'Cyberstalking'] },
    { group: 'Drug Offences', subs: ['Possession', 'Trafficking', 'Manufacturing'] },
  ]
  for (const ch of crimeHeads) {
    const r = await pool.query(
      'INSERT INTO crime_head (crime_group) VALUES ($1) ON CONFLICT DO NOTHING RETURNING id',
      [ch.group]
    )
    const headId = r.rowCount ? r.rows[0].id : (await pool.query('SELECT id FROM crime_head WHERE crime_group=$1', [ch.group])).rows[0]?.id
    if (headId) {
      for (const sub of ch.subs) {
        await pool.query('INSERT INTO crime_subhead (crime_head_id, subhead_name) VALUES ($1,$2) ON CONFLICT DO NOTHING', [headId, sub])
      }
    }
  }

  // Case statuses
  const statuses = ['Open', 'Under Investigation', 'Charge Sheet Filed', 'Trial in Progress', 'Convicted', 'Acquitted', 'Closed', 'Pending']
  for (const s of statuses) {
    await pool.query('INSERT INTO case_status_master (status_name) VALUES ($1) ON CONFLICT (status_name) DO NOTHING', [s])
  }

  // Court types
  const courts = [
    { name: 'Chennai District Court', district: 'Chennai', state: 'Tamil Nadu', type: 'District Court' },
    { name: 'Madras High Court', district: 'Chennai', state: 'Tamil Nadu', type: 'High Court' },
    { name: 'Coimbatore District Court', district: 'Coimbatore', state: 'Tamil Nadu', type: 'District Court' },
    { name: 'Bengaluru City Civil Court', district: 'Bengaluru Urban', state: 'Karnataka', type: 'City Civil Court' },
    { name: 'Karnataka High Court', district: 'Bengaluru Urban', state: 'Karnataka', type: 'High Court' },
  ]
  for (const c of courts) {
    await pool.query(
      'INSERT INTO courts (court_name, district, state, court_type) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING',
      [c.name, c.district, c.state, c.type]
    )
  }

  console.log('[ExtendedSchema] Master data seeded')
}

module.exports = createExtendedSchema
