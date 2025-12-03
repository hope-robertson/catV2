// server/index.ts (TEMPORARY TROUBLESHOOTING FILE)

import * as dotenv from 'dotenv'
dotenv.config()
// import uploadRouter from './routes/upload.js' // COMMENTED OUT

import express from 'express'
// import * as Path from 'node:path' // COMMENTED OUT

// import catalogueRoutes from './routes/catalogue.js' // COMMENTED OUT
// import aggregationRoutes from './routes/aggregation.js' // COMMENTED OUT
import { initializeCheckJwt } from './utils/auth.js' // COMMENTED OUT

const checkJwt = initializeCheckJwt() // COMMENTED OUT

const server = express()
const PORT = process.env.PORT || 3000

server.use(express.json()) // COMMENTED OUT
// server.use(express.static(Path.join(Path.resolve(), 'public'))) // COMMENTED OUT
// server.use('/api/v1/upload', uploadRouter) // COMMENTED OUT

// server.use('/api/v1/catalogue', checkJwt, catalogueRoutes) // COMMENTED OUT
// server.use('/api/v1/aggregation', checkJwt, aggregationRoutes) // COMMENTED OUT

server.get('/', (req, res) => {
  res.send('Core Server Is Running!')
})

if (process.env.NODE_ENV === 'production') {
  // server.get('*', (req, res) => { // COMMENTED OUT
  //   res.sendFile(Path.resolve('public/index.html')) // COMMENTED OUT
  // })
}

// Start Server
server.listen(PORT as number, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`)
})