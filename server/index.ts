// server/index.ts

// 1. LOAD DOTENV FIRST
import * as dotenv from 'dotenv'
dotenv.config() // <-- MUST BE THE FIRST EXECUTABLE LINE

// 2. IMPORT REMAINING MODULES
import express from 'express'
import * as Path from 'node:path'

import catalogueRoutes from './routes/catalogue.js'
import { checkJwt } from './utils/auth.js' // <-- This import now happens after dotenv is configured

const server = express()
const PORT = process.env.PORT || 3000

// Server Middleware
server.use(express.json())
server.use(express.static(Path.join(Path.resolve(), 'public')))

// API Routes
server.use('/api/v1/catalogue', checkJwt, catalogueRoutes)

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
