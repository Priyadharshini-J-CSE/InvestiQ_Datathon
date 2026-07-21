const { firs } = require('../config/mockData')

exports.getAll = (req, res) => {
  const { page = 1, limit = 20, status, district } = req.query
  let data = [...firs]
  if (status) data = data.filter(f => f.status === status)
  if (district) data = data.filter(f => f.district === district)
  const start = (page - 1) * limit
  res.json({ success: true, data: data.slice(start, start + Number(limit)), total: data.length, page: Number(page) })
}

exports.getById = (req, res) => {
  const fir = firs.find(f => f.id === req.params.id)
  if (!fir) return res.status(404).json({ error: 'FIR not found' })
  res.json({ success: true, data: fir })
}
