const { criminals } = require('../config/mockData')

exports.getAll = (req, res) => {
  const { status, category } = req.query
  let data = [...criminals]
  if (status) data = data.filter(c => c.status === status)
  if (category) data = data.filter(c => c.category === category)
  res.json({ success: true, data, total: data.length })
}

exports.getById = (req, res) => {
  const criminal = criminals.find(c => c.id === req.params.id)
  if (!criminal) return res.status(404).json({ error: 'Criminal not found' })
  res.json({ success: true, data: criminal })
}
