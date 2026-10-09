// knexfile.js
import * as Path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = Path.dirname(__filename)

const config = {
  development: {
    client: 'sqlite3',
    useNullAsDefault: true,
    connection: {
      filename: Path.join(__dirname, 'server', 'db', 'catV2.sqlite3'),
    },
    pool: {
      afterCreate: (conn, cb) => conn.run('PRAGMA foreign_keys = ON', cb),
    },
    migrations: {
      directory: Path.join(__dirname, 'server', 'db', 'migrations'),
    },
    seeds: {
      directory: Path.join(__dirname, 'server', 'db', 'seeds'),
    },
  },
  production: {
    client: 'sqlite3',
    useNullAsDefault: true,
    connection: {
      filename:
        process.env.DATABASE_URL ||
        Path.join(__dirname, 'server', 'db', 'catV2.sqlite3'),
    },
    pool: {
      afterCreate: (conn, cb) => conn.run('PRAGMA foreign_keys = ON', cb),
    },
    migrations: {
      directory: Path.join(__dirname, 'server', 'db', 'migrations'),
    },
    seeds: {
      directory: Path.join(__dirname, 'server', 'db', 'seeds'),
    },
  },
}

/** @type {{ [k: string]: any }} */
const indexableConfig = config

export default indexableConfig
