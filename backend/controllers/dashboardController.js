const { stats, monthlyData } = require('../config/mockData')

exports.getStats = (req, res) => res.json({ success: true, data: stats })
exports.getAnalytics = (req, res) => res.json({ success: true, data: { stats, monthlyData } })
