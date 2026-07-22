const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const pool = require('../config/db')

exports.login = async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' })

  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username])
    const user = result.rows[0]
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' })
    const { password: _, ...userData } = user
    res.json({ token, user: userData })
  } catch (err) {
    console.error('Login error:', err.message)
    res.status(500).json({ error: 'Server error' })
  }
}

exports.register = async (req, res) => {
  const { username, password, name, role, badge } = req.body
  if (!username || !password || !name) return res.status(400).json({ error: 'Username, password and name are required' })

  try {
    const exists = await pool.query('SELECT id FROM users WHERE username = $1', [username])
    if (exists.rowCount > 0) return res.status(409).json({ error: 'Username already taken' })

    const hash = await bcrypt.hash(password, 10)
    const result = await pool.query(
      'INSERT INTO users (username, password, name, role, badge) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, name, role, badge',
      [username, hash, name, role || 'Officer', badge || '']
    )
    res.status(201).json({ message: 'Account created successfully', user: result.rows[0] })
  } catch (err) {
    console.error('Register error:', err.message)
    res.status(500).json({ error: 'Server error' })
  }
}
