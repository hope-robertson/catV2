// server/index.ts
import * as dotenv from 'dotenv'
dotenv.config()
import uploadRouter from './routes/upload.js'

import express from 'express'
import * as Path from 'node:path'

import catalogueRoutes from './routes/catalogue.js' // Catalogue routes imported

import { initializeCheckJwt } from './utils/auth.js'

// 3. INITIALIZE AUTH MIDDLEWARE (MUST happen here, AFTER dotenv.config())
const checkJwt = initializeCheckJwt()

const server = express()
const PORT = process.env.PORT || 3000 // Port 3000 set as fallback

// Server Middleware
server.use(express.json()) // JSON body parser
server.use(express.static(Path.join(Path.resolve(), 'public')))

// API Routes
// 1. Upload/Rename Routes (Protected)
server.use('/api/v1/upload', checkJwt, uploadRouter)

// 2. Catalogue Import/Query Routes (Protected - THIS WAS THE MISSING LINE)
server.use('/api/v1/catalogue', checkJwt, catalogueRoutes)

// Health Check / Placeholder Route
server.get('/', (req, res) => {
  res.send('Core Server Is Running!')
})

// Serve the production front-end (if applicable)
if (process.env.NODE_ENV === 'production') {
  server.get('*', (req, res) => {
    res.sendFile(Path.resolve('public/index.html'))
  })
}

// Start Server
server.listen(PORT as number, '0.0.0.0', () => {
  // TypeScript fix and universal bind address
  console.log(`Server listening on port ${PORT}`)
})
