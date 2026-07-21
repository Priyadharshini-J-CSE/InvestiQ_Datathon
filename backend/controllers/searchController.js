const { firs, criminals } = require('../config/mockData')
const axios = require('axios')

exports.search = async (req, res) => {
  const { query, filters = {} } = req.body
  if (!query) return res.status(400).json({ error: 'Query required' })

  // Try AI search first, fallback to keyword
  try {
    const aiRes = await axios.post(`${process.env.AI_API_URL}/search`, { query }, { timeout: 5000 })
    return res.json({ success: true, data: aiRes.data.results, source: 'semantic' })
  } catch {
    const q = query.toLowerCase()
    const results = firs.filter(f =>
      f.title.toLowerCase().includes(q) ||
      f.accused.toLowerCase().includes(q) ||
      f.ipcSections.toLowerCase().includes(q) ||
      f.district.toLowerCase().includes(q)
    ).map(f => ({ ...f, matchScore: Math.floor(Math.random() * 30) + 70 }))
    res.json({ success: true, data: results.slice(0, 20), source: 'keyword' })
  }
}
