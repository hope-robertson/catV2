// knexfile.js
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default {
  development: {
    client: 'sqlite3',
    useNullAsDefault: true,
    connection: {
      filename: path.join(__dirname, 'server', 'db', 'catV2.sqlite3'),
    },
    pool: {
      afterCreate: (conn, cb) => {
        conn.run('PRAGMA foreign_keys = ON', cb)
      },
    },
    migrations: {
      // UPDATED THIS LINE:
      directory: path.join(__dirname, 'server', 'db', 'migrations'), // Added 'db' here
    },
    seeds: {
      directory: path.join(__dirname, 'server', 'seeds'),
    },
  },
}
