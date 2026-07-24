const pool = require('./db')
const bcrypt = require('bcryptjs')

async function createSchema() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'Officer',
        badge VARCHAR(50),
        station VARCHAR(100),
        status VARCHAR(20) DEFAULT 'Active',
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS districts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS police_stations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        district VARCHAR(100),
        address TEXT,
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_by INTEGER REFERENCES users(id)
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS officers (
        id SERIAL PRIMARY KEY,
        excel_id VARCHAR(50) UNIQUE,
        badge_number VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        rank VARCHAR(50),
        station_id INTEGER REFERENCES police_stations(id),
        district VARCHAR(100),
        phone VARCHAR(20),
        email VARCHAR(100),
        joining_date DATE,
        status VARCHAR(20) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_by INTEGER REFERENCES users(id),
        modified_by INTEGER REFERENCES users(id)
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS persons (
        id SERIAL PRIMARY KEY,
        person_id VARCHAR(50) UNIQUE,
        excel_id VARCHAR(50) UNIQUE,
        full_name VARCHAR(150) NOT NULL,
        gender VARCHAR(10),
        dob DATE,
        age INTEGER,
        phone VARCHAR(20),
        email VARCHAR(100),
        occupation VARCHAR(100),
        nationality VARCHAR(50) DEFAULT 'Indian',
        address TEXT,
        aadhaar VARCHAR(20),
        photo_url TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_by INTEGER REFERENCES users(id),
        modified_by INTEGER REFERENCES users(id)
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS criminals (
        id SERIAL PRIMARY KEY,
        criminal_id VARCHAR(50) UNIQUE,
        excel_id VARCHAR(50) UNIQUE,
        person_id INTEGER REFERENCES persons(id),
        name VARCHAR(150) NOT NULL,
        alias VARCHAR(100),
        gender VARCHAR(10),
        age INTEGER,
        address TEXT,
        fingerprint_id VARCHAR(100),
        dna_id VARCHAR(100),
        risk_level VARCHAR(20) DEFAULT 'Low',
        gang VARCHAR(100),
        crime_category VARCHAR(100),
        repeat_offender BOOLEAN DEFAULT FALSE,
        status VARCHAR(50) DEFAULT 'Active',
        notes TEXT,
        photo_url TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_by INTEGER REFERENCES users(id),
        modified_by INTEGER REFERENCES users(id)
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS firs (
        id SERIAL PRIMARY KEY,
        excel_id VARCHAR(50) UNIQUE,
        fir_number VARCHAR(50) UNIQUE NOT NULL,
        station_id INTEGER REFERENCES police_stations(id),
        district VARCHAR(100),
        date DATE NOT NULL,
        crime_type VARCHAR(100),
        ipc_sections TEXT,
        complainant VARCHAR(150),
        victim VARCHAR(150),
        accused VARCHAR(150),
        description TEXT,
        status VARCHAR(50) DEFAULT 'Open',
        officer_id INTEGER REFERENCES officers(id),
        attachment_url TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_by INTEGER REFERENCES users(id),
        modified_by INTEGER REFERENCES users(id)
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS cases (
        id SERIAL PRIMARY KEY,
        excel_id VARCHAR(50) UNIQUE,
        case_number VARCHAR(50) UNIQUE NOT NULL,
        fir_id INTEGER REFERENCES firs(id),
        court VARCHAR(150),
        judge VARCHAR(100),
        officer_id INTEGER REFERENCES officers(id),
        status VARCHAR(50) DEFAULT 'Open',
        investigation_status VARCHAR(50) DEFAULT 'Ongoing',
        court_date DATE,
        closing_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_by INTEGER REFERENCES users(id),
        modified_by INTEGER REFERENCES users(id)
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS charges (
        id SERIAL PRIMARY KEY,
        excel_id VARCHAR(50) UNIQUE,
        case_id INTEGER REFERENCES cases(id),
        criminal_id INTEGER REFERENCES criminals(id),
        ipc_section VARCHAR(100),
        description TEXT,
        filed_date DATE,
        status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_by INTEGER REFERENCES users(id),
        modified_by INTEGER REFERENCES users(id)
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS arrests (
        id SERIAL PRIMARY KEY,
        excel_id VARCHAR(50) UNIQUE,
        criminal_id INTEGER REFERENCES criminals(id),
        officer_id INTEGER REFERENCES officers(id),
        arrest_date DATE NOT NULL,
        location VARCHAR(200),
        reason TEXT,
        bail_status VARCHAR(50) DEFAULT 'Not Applied',
        custody_status VARCHAR(50) DEFAULT 'In Custody',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_by INTEGER REFERENCES users(id),
        modified_by INTEGER REFERENCES users(id)
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS convictions (
        id SERIAL PRIMARY KEY,
        excel_id VARCHAR(50) UNIQUE,
        case_id INTEGER REFERENCES cases(id),
        criminal_id INTEGER REFERENCES criminals(id),
        court VARCHAR(150),
        judge VARCHAR(100),
        sentence TEXT,
        fine NUMERIC(12,2),
        prison VARCHAR(150),
        conviction_date DATE,
        release_date DATE,
        appeal_status VARCHAR(50) DEFAULT 'None',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_by INTEGER REFERENCES users(id),
        modified_by INTEGER REFERENCES users(id)
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS evidence (
        id SERIAL PRIMARY KEY,
        excel_id VARCHAR(50) UNIQUE,
        case_id INTEGER REFERENCES cases(id),
        evidence_type VARCHAR(50),
        description TEXT,
        collected_by INTEGER REFERENCES officers(id),
        collected_date DATE,
        location VARCHAR(200),
        storage_location VARCHAR(200),
        file_url TEXT,
        status VARCHAR(50) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_by INTEGER REFERENCES users(id),
        modified_by INTEGER REFERENCES users(id)
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS wanted (
        id SERIAL PRIMARY KEY,
        excel_id VARCHAR(50) UNIQUE,
        criminal_id INTEGER REFERENCES criminals(id),
        reward NUMERIC(12,2),
        declared_date DATE,
        priority VARCHAR(20) DEFAULT 'Medium',
        last_seen VARCHAR(200),
        last_seen_date DATE,
        status VARCHAR(50) DEFAULT 'Active',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_by INTEGER REFERENCES users(id),
        modified_by INTEGER REFERENCES users(id)
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS warrants (
        id SERIAL PRIMARY KEY,
        excel_id VARCHAR(50) UNIQUE,
        criminal_id INTEGER REFERENCES criminals(id),
        warrant_type VARCHAR(100),
        issue_date DATE,
        expiry_date DATE,
        status VARCHAR(50) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action VARCHAR(100),
        table_name VARCHAR(100),
        record_id INTEGER,
        old_data JSONB,
        new_data JSONB,
        ip_address VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        description TEXT,
        module VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)

    await client.query('COMMIT')
    console.log('All tables created successfully')

    // Seed districts
    const districtNames = [
      'Bengaluru Urban','Bengaluru Rural','Mysuru','Mangaluru','Hubballi-Dharwad',
      'Belagavi','Kalaburagi','Ballari','Shivamogga','Tumakuru',
      'Vijayapura','Raichur','Bidar','Yadgir','Koppal',
      'Gadag','Dharwad','Uttara Kannada','Haveri','Davanagere',
      'Chitradurga','Chikkamagaluru','Hassan','Kodagu','Mandya',
      'Chamarajanagar','Ramanagara','Chikkaballapura','Kolar','Bagalkot'
    ]
    for (const d of districtNames) {
      await pool.query('INSERT INTO districts (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [d])
    }

    // Seed default users
    const { rowCount } = await pool.query('SELECT id FROM users LIMIT 1')
    if (rowCount === 0) {
      const users = [
        { username: 'admin',        password: 'admin123',   name: 'SP Rajesh Kumar', role: 'Admin',    badge: 'KSP-001' },
        { username: 'officer',      password: 'officer123', name: 'SI Suresh Gowda', role: 'Officer',  badge: 'KSP-042' },
        { username: 'investigator', password: 'inv123',     name: 'PI Mahesh Nair',  role: 'Inspector',badge: 'KSP-118' },
      ]
      for (const u of users) {
        const hash = await bcrypt.hash(u.password, 10)
        await pool.query(
          'INSERT INTO users (username, password, name, role, badge) VALUES ($1,$2,$3,$4,$5)',
          [u.username, hash, u.name, u.role, u.badge]
        )
      }
      console.log('Default users seeded')
    }

  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Schema error:', err.message)
  } finally {
    client.release()
  }
}

module.exports = createSchema
