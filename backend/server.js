const app = require('./app')
const initDB = require('./config/schema')
const createExtendedSchema = require('./config/schemaExtended')
const PORT = process.env.PORT || 5000

initDB()
  .then(() => createExtendedSchema())
  .then(() => {
    app.listen(PORT, () => {
      console.log(`InvestiQ Backend running on http://localhost:${PORT}`)
    })
  })
