import * as dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import * as Path from 'node:path'

import uploadRouter from './routes/upload.js'
import catalogueRoutes from './routes/catalogue.js'
import staffRoutes from './routes/staff.js'
import orderRoutes from './routes/orders.js'
import adminRoutes from './routes/admin.js'
import { checkJwt } from './utils/auth.js' // Updated import name

const server = express()
const PORT = process.env.PORT || 3000

server.use(express.json())
server.use(express.static(Path.join(Path.resolve(), 'public')))

// API Routes
// Note: We apply checkJwt to orders and admin to protect shop business data
server.use('/api/v1/staff', staffRoutes)
server.use('/api/v1/orders', checkJwt, orderRoutes)
server.use('/api/v1/admin', checkJwt, adminRoutes)
server.use('/api/v1/upload', checkJwt, uploadRouter)
server.use('/api/v1/catalogue', checkJwt, catalogueRoutes)

server.get('/', (req, res) => {
  res.send('Core Server Is Running!')
})

if (process.env.NODE_ENV === 'production') {
  server.get('*', (req, res) => {
    res.sendFile(Path.resolve('public/index.html'))
  })
}

// Added the host '0.0.0.0' for better compatibility with Codespaces/Local Network
server.listen(PORT as number, '0.0.0.0', () => {
  console.log(`🚀 Server listening on port ${PORT}`)
})
