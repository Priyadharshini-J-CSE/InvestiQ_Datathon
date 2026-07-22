const pool = require('./db')
const bcrypt = require('bcryptjs')

async function initDB() {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        role VARCHAR(50) NOT NULL,
        badge VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log('Users table ready')

    // Seed default users if table is empty
    const { rowCount } = await pool.query('SELECT id FROM users LIMIT 1')
    if (rowCount === 0) {
      const users = [
        { username: 'admin',        password: 'admin123',   name: 'SP Rajesh Kumar', role: 'Admin',         badge: 'KSP-001' },
        { username: 'officer',      password: 'officer123', name: 'SI Suresh Gowda', role: 'Officer',       badge: 'KSP-042' },
        { username: 'investigator', password: 'inv123',     name: 'PI Mahesh Nair',  role: 'Investigator',  badge: 'KSP-118' },
      ]
      for (const u of users) {
        const hash = await bcrypt.hash(u.password, 10)
        await pool.query(
          'INSERT INTO users (username, password, name, role, badge) VALUES ($1, $2, $3, $4, $5)',
          [u.username, hash, u.name, u.role, u.badge]
        )
      }
      console.log('Default users seeded')
    }
  } catch (err) {
    console.error('DB init error:', err.message)
  }
}

module.exports = initDB
