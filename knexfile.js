// knexfile.js
import * as Path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = Path.dirname(__filename)

// Add a type definition for the configuration
/**
 * @typedef {object} KnexConfig
 * @property {object} development
 * @property {string} development.client
 * // Add more properties as needed
 */

// Explicitly define the config object with the type definition
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
}

// Add an index signature to the config object so TypeScript knows it's indexable by a string.
// This is the key change to fix the error in connection.ts
/** @type {{ [k: string]: any }} */
const indexableConfig = config

export default indexableConfig
