const { Pool } = require('pg')

const pool = new Pool({
  host:     process.env.POSTGRES_HOST     || process.env.PG_HOST     || 'localhost',
  port:     process.env.POSTGRES_PORT     || process.env.PG_PORT     || 5432,
  database: process.env.POSTGRES_DB       || process.env.PG_DATABASE || 'investiq',
  user:     process.env.POSTGRES_USER     || process.env.PG_USER     || 'postgres',
  password: process.env.POSTGRES_PASSWORD || process.env.PG_PASSWORD || '',
})

pool.connect((err, client, release) => {
  if (err) {
    console.error('PostgreSQL connection error:', err.message)
  } else {
    console.log('PostgreSQL connected successfully')
    release()
  }
})

module.exports = pool
