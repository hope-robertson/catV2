import { auth } from 'express-oauth2-jwt-bearer'
import dotenv from 'dotenv'
import path from 'path'

// 🎯 Force look at the local folder .env
const envPath = path.resolve(process.cwd(), '.env')
dotenv.config({ path: envPath })

console.log('--- 🛡️ Auth0 Diagnostic ---')
console.log('Current Working Directory:', process.cwd())
console.log('Looking for .env at:', envPath)

// This will list EVERY key that dotenv actually found
const allKeys = Object.keys(process.env)
const auth0Keys = allKeys.filter(
  (k) => !k.startsWith('npm_') && !k.startsWith('NODE_'),
)

console.log('Detected AUTH0 Keys:', auth0Keys)
console.log('Values (First 5 chars):')
console.log(
  ' - Audience:',
  process.env.AUTH0_AUDIENCE?.substring(0, 10) + '...',
)
console.log(
  ' - Issuer:',
  process.env.AUTH0_ISSUER_BASE_URL?.substring(0, 10) + '...',
)
console.log('--------------------------')

export const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
  tokenSigningAlg: 'RS256',
})
