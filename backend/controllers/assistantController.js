const axios = require('axios')

const AI_API_URL = process.env.AI_API_URL || 'http://localhost:5001'

exports.ask = async (req, res) => {
  const { message, history = [] } = req.body
  if (!message) return res.status(400).json({ success: false, error: 'Message required' })

  try {
    const aiRes = await axios.post(
      `${AI_API_URL}/ask`,
      { query: message, history },
      { timeout: 45000 }
    )

    const data = aiRes.data
    return res.json({
      success: true,
      response: data.response,
      confidence: data.confidence,
      sources: data.sources || []
    })

  } catch (err) {
    // Log the full error so it's never hidden
    console.error('[assistantController] AI API call failed:')
    console.error('  Status :', err.response?.status)
    console.error('  Data   :', JSON.stringify(err.response?.data))
    console.error('  Message:', err.message)

    // Extract the real error message from Python API if available
    const pythonError = err.response?.data?.error || err.response?.data?.message || null
    const isConnectionRefused = err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET'

    let userMessage
    if (isConnectionRefused) {
      userMessage = 'Python AI service is not running. Start it with: cd model && python api.py'
    } else if (pythonError) {
      userMessage = pythonError
    } else if (err.code === 'ECONNABORTED') {
      userMessage = 'AI service timed out. The query may be too complex — try again.'
    } else {
      userMessage = `AI service error: ${err.message}`
    }

    const statusCode = isConnectionRefused ? 503 : (err.response?.status || 500)
    return res.status(statusCode).json({ success: false, error: userMessage })
  }
}
