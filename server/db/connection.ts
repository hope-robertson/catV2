// server/db/connection.ts
import knex from 'knex'
import config from '../../knexfile.js'

const environment = process.env.NODE_ENV || 'development'
const connection = knex(config[environment])
const db = knex(config.development)

export default connection
