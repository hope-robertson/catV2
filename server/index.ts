import * as dotenv from 'dotenv'
dotenv.config()
import express from 'express'
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
