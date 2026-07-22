const app = require('./app')
const initDB = require('./config/initDB')
const PORT = process.env.PORT || 5000

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`InvestiQ Backend running on http://localhost:${PORT}`)
  })
})
