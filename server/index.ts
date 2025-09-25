// server/index.ts

// 1. LOAD DOTENV FIRST
import * as dotenv from 'dotenv'
dotenv.config()

// 2. IMPORT REMAINING MODULES
import express from 'express'
import * as Path from 'node:path'

import catalogueRoutes from './routes/catalogue.js'
import { initializeCheckJwt } from './utils/auth.js' // <-- Import the function

// 3. INITIALIZE AUTH MIDDLEWARE (MUST happen here, AFTER dotenv.config())
const checkJwt = initializeCheckJwt()

const server = express()
const PORT = process.env.PORT || 3000

// Server Middleware
server.use(express.json())
server.use(express.static(Path.join(Path.resolve(), 'public')))

// API Routes
server.use('/api/v1/catalogue', checkJwt, catalogueRoutes) // Use the initialized middleware

// Serve the production front-end (if applicable)
if (process.env.NODE_ENV === 'production') {
  server.get('*', (req, res) => {
    res.sendFile(Path.resolve('public/index.html'))
  })
}

// Start Server
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})
