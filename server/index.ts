import * as dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import cors from 'cors'
import * as Path from 'node:path'

import uploadRouter from './routes/upload.js'
import catalogueRoutes from './routes/catalogue.js'
import staffRoutes from './routes/staff.js'
import orderRoutes from './routes/orders.js'
import adminRoutes from './routes/admin.js'
import customerRoutes from './routes/customers.js'
import wishlistRoutes from './routes/wishlist.js'
import { checkJwt } from './utils/auth.js'

const server = express()
const PORT = process.env.PORT || 3000

// 🎯 CORS Configuration for Vercel & Local Dev
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL,
].filter(Boolean) as string[]

server.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (e.g., curl, mobile apps, server-to-server)
      if (!origin) return callback(null, true)

      // Allow if origin matches allowed list or any Vercel domain/preview deployment
      const isAllowed =
        allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)

      if (isAllowed) {
        callback(null, true)
      } else {
        callback(new Error(`CORS blocked request from origin: ${origin}`))
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
)

server.use(express.json())
server.use(express.static(Path.join(Path.resolve(), 'public')))

// API Routes
server.use('/api/v1/staff', staffRoutes)
server.use('/api/v1/orders', checkJwt, orderRoutes)
server.use('/api/v1/admin', checkJwt, adminRoutes)
server.use('/api/v1/customers', checkJwt, customerRoutes)
server.use('/api/v1/upload', checkJwt, uploadRouter)
server.use('/api/v1/catalogue', checkJwt, catalogueRoutes)
server.use('/api/v1/wishlist', checkJwt, wishlistRoutes)

server.get('/', (req, res) => {
  res.send('Core Server Is Running!')
})

if (process.env.NODE_ENV === 'production') {
  server.get('*', (req, res) => {
    res.sendFile(Path.resolve('public/index.html'))
  })
}

server.listen(PORT as number, '0.0.0.0', () => {
  console.log(` Server listening on port ${PORT}`)
})
