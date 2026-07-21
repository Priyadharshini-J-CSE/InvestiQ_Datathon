const jwt = require('jsonwebtoken')

const users = [
  { id: 1, username: 'admin', password: 'admin123', name: 'SP Rajesh Kumar', role: 'Admin', badge: 'KSP-001' },
  { id: 2, username: 'officer', password: 'officer123', name: 'SI Suresh Gowda', role: 'Officer', badge: 'KSP-042' },
  { id: 3, username: 'investigator', password: 'inv123', name: 'PI Mahesh Nair', role: 'Investigator', badge: 'KSP-118' },
]

exports.login = (req, res) => {
  const { username, password } = req.body
  const user = users.find(u => u.username === username && u.password === password)
  if (!user) return res.status(401).json({ error: 'Invalid credentials' })
  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' })
  const { password: _, ...userData } = user
  res.json({ token, user: userData })
}
