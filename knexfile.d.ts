// knexfile.d.ts

// This empty export makes the file a module in TypeScript's eyes,
// which can sometimes resolve issues where declaration files aren't picked up.
export {}

// This declares the shape of the default export from knexfile.js.
// It tells TypeScript what to expect when you import it.
declare module '../../knexfile.js' {
  // Import Knex types for more specific typing if you want to be precise
  import { Knex } from 'knex'

  // Define the structure of your knex configuration
  interface KnexConfig {
    development: Knex.Config
    production?: Knex.Config // Include other environments if you have them
    [key: string]: Knex.Config | undefined // Allows for additional environment keys
  }

  // Declare the default export as adhering to the KnexConfig interface
  const config: KnexConfig
  export default config
}
