// knexfile.js
import * as Path from 'node:path' // Use node: prefix for built-in modules
import { fileURLToPath } from 'node:url' // Use node: prefix for built-in modules
// import * as dotenv from 'dotenv'; // Only if you need dotenv in knexfile itself
// dotenv.config(); // Only if you need dotenv in knexfile itself

const __filename = fileURLToPath(import.meta.url)
const __dirname = Path.dirname(__filename)

// Explicitly define the config object
const config = {
  development: {
    client: 'sqlite3',
    useNullAsDefault: true,
    connection: {
      filename: Path.join(__dirname, 'server', 'db', 'catV2.sqlite3'), // Your database name
    },
    pool: {
      afterCreate: (conn, cb) => conn.run('PRAGMA foreign_keys = ON', cb),
    },
    migrations: {
      directory: Path.join(__dirname, 'server', 'db', 'migrations'), // Corrected path
    },
    seeds: {
      directory: Path.join(__dirname, 'server', 'db', 'seeds'), // Assuming seeds are also there
    },
  },

  // You can add test and production environments here later if needed
  // test: { ... },
  // production: { ... },
}

export default config // Export the named config object as default
