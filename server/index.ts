// server/index.ts

// 1. LOAD DOTENV FIRST
import * as dotenv from 'dotenv'
dotenv.config()
import uploadRouter from './routes/upload.js'

// 2. IMPORT REMAINING MODULES
import express from 'express'
import * as Path from 'node:path'

import catalogueRoutes from './routes/catalogue.js'
import aggregationRoutes from './routes/aggregation.js' // <== ADDED
import { initializeCheckJwt } from './utils/auth.js' 

// 3. INITIALIZE AUTH MIDDLEWARE (MUST happen here, AFTER dotenv.config())
const checkJwt = initializeCheckJwt()

const server = express()
const PORT = process.env.PORT || 4000

// Server Middleware
server.use(express.json())
server.use(express.static(Path.join(Path.resolve(), 'public')))
server.use('/api/v1/upload', uploadRouter)

// API Routes
server.use('/api/v1/catalogue', checkJwt, catalogueRoutes) 
server.use('/api/v1/aggregation', checkJwt, aggregationRoutes) // <== ADDED AND PROTECTED

// Serve the production front-end (if applicable)
if (process.env.NODE_ENV === 'production') {
  server.get('*', (req, res) => {
    res.sendFile(Path.resolve('public/index.html'))
  })
}

// Start Server
server.listen(PORT as number, '0.0.0.0', () => { // <== MODIFIED BIND ADDRESS
  console.log(`Server listening on port ${PORT}`)
})