// server/index.ts
import * as dotenv from 'dotenv'
dotenv.config() // Load environment variables from .env file

import express from 'express'
import * as Path from 'node:path'

import catalogueRoutes from './routes/catalogue.js' // Assuming your routes are here
import { checkJwt } from './utils/auth.js' // Assuming your Auth0 middleware is here

const server = express()
const PORT = process.env.PORT || 3000

// Server Middleware
server.use(express.json())
server.use(express.static(Path.join(Path.resolve(), 'public')))

// API Routes
server.use('/api/v1/catalogue', checkJwt, catalogueRoutes) // Protecting all catalogue routes

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
