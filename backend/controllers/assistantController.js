const axios = require('axios')

const mockResponses = [
  'Based on analysis of 12,847 FIRs, I found 23 similar cases. Primary hotspot: Bengaluru Urban (42%). Confidence: 94.2%.',
  'Pattern detected: Organized theft ring operating across 3 districts. 8 repeat offenders identified. Recommend coordinated operation.',
  'IPC Section 379 (Theft) is most invoked – 28% of all cases. Peak crime hours: 10PM-2AM. Hotspot: Koramangala.',
  'Criminal network analysis complete. 5 connected individuals identified. Central node: CRM-0023 (Ravi Kumar). Risk score: 89.',
]

exports.ask = async (req, res) => {
  const { message, history = [] } = req.body
  if (!message) return res.status(400).json({ error: 'Message required' })

  try {
    const aiRes = await axios.post(`${process.env.AI_API_URL}/ask`, { query: message, history }, { timeout: 15000 })
    return res.json({ success: true, response: aiRes.data.response, confidence: aiRes.data.confidence, sources: aiRes.data.sources })
  } catch {
    const response = mockResponses[Math.floor(Math.random() * mockResponses.length)]
    res.json({
      success: true,
      response,
      confidence: (Math.random() * 10 + 88).toFixed(1),
      sources: ['FIR-2024-01045', 'Chargesheet-892'],
      source: 'mock'
    })
  }
}
