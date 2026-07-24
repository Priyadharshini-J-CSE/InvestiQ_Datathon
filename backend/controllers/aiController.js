const axios = require('axios')
const pool = require('../config/db')

const AI_URL = process.env.AI_API_URL || 'http://localhost:5001'
const ai = (path, body) => axios.post(`${AI_URL}${path}`, body, { timeout: 45000 })

exports.semanticSearch = async (req, res) => {
  const { query, top_k = 10 } = req.body
  if (!query) return res.status(400).json({ error: 'Query required' })
  try {
    const r = await ai('/search', { query, top_k })
    res.json(r.data)
  } catch (err) {
    // fallback: keyword search from DB
    try {
      const q = `%${query}%`
      const rows = await pool.query(
        `SELECT fir_number as id, crime_type, district, description, status, date
         FROM firs WHERE description ILIKE $1 OR crime_type ILIKE $1 OR district ILIKE $1 LIMIT 20`,
        [q]
      )
      res.json({ success: true, results: rows.rows, source: 'keyword' })
    } catch (e) { res.status(500).json({ error: e.message }) }
  }
}

exports.summarize = async (req, res) => {
  const { text, fir_id } = req.body
  let content = text
  if (!content && fir_id) {
    try {
      const r = await pool.query('SELECT * FROM firs WHERE id=$1', [fir_id])
      if (r.rowCount) {
        const f = r.rows[0]
        content = `FIR Number: ${f.fir_number}\nDate: ${f.date}\nCrime Type: ${f.crime_type}\nDistrict: ${f.district}\nDescription: ${f.description}\nStatus: ${f.status}`
      }
    } catch (e) { return res.status(500).json({ error: e.message }) }
  }
  if (!content) return res.status(400).json({ error: 'text or fir_id required' })
  try {
    const r = await ai('/summarize', { text: content })
    res.json(r.data)
  } catch (err) { res.status(500).json({ error: err.response?.data?.error || err.message }) }
}

exports.predict = async (req, res) => {
  const { district } = req.body
  try {
    const r = await ai('/predict', { district: district || 'all districts' })
    res.json(r.data)
  } catch (err) { res.status(500).json({ error: err.response?.data?.error || err.message }) }
}

exports.behavioralProfile = async (req, res) => {
  const { criminal_id, name } = req.body
  if (!criminal_id && !name) return res.status(400).json({ error: 'criminal_id or name required' })
  try {
    const r = await ai('/profile', { criminal_id, name })
    res.json(r.data)
  } catch (err) { res.status(500).json({ error: err.response?.data?.error || err.message }) }
}

exports.network = async (req, res) => {
  const { query } = req.body
  try {
    const r = await ai('/network', { query: query || 'criminal network gang associates' })
    res.json(r.data)
  } catch (err) {
    // fallback: build basic network from DB
    try {
      const criminals = await pool.query(
        `SELECT c.criminal_id, c.name, c.gang, c.risk_level FROM criminals c LIMIT 20`
      )
      const nodes = criminals.rows.map(c => ({ id: c.criminal_id, type: 'criminal', label: c.name || c.criminal_id, risk: c.risk_level }))
      const gangs = [...new Set(criminals.rows.filter(c => c.gang).map(c => c.gang))]
      gangs.forEach(g => nodes.push({ id: g, type: 'gang', label: g }))
      const edges = criminals.rows.filter(c => c.gang).map(c => ({ source: c.criminal_id, target: c.gang, label: 'member of' }))
      res.json({ success: true, nodes, edges, source: 'db' })
    } catch (e) { res.status(500).json({ error: e.message }) }
  }
}

exports.chatHistory = async (req, res) => {
  try {
    const userId = req.user.id
    const r = await pool.query(
      `SELECT id, message, response, created_at FROM chat_history WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50`,
      [userId]
    )
    res.json({ success: true, data: r.rows })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

exports.saveChatHistory = async (req, res) => {
  const { message, response } = req.body
  if (!message || !response) return res.status(400).json({ error: 'message and response required' })
  try {
    await pool.query(
      `INSERT INTO chat_history (user_id, message, response) VALUES ($1, $2, $3)`,
      [req.user.id, message, response]
    )
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
}
