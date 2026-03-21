import { auth } from 'express-oauth2-jwt-bearer'
import dotenv from 'dotenv'
import path from 'path' // 👈 Add this

// 🎯 Explicitly point to the root .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

console.log('--- Auth0 Connection Test ---')
console.log('Audience:', process.env.AUTH0_AUDIENCE)
console.log('Issuer:', process.env.AUTH0_ISSUER_BASE_URL)
console.log('-----------------------------')

export const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
  tokenSigningAlg: 'RS256',
})
