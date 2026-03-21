import { auth } from 'express-oauth2-jwt-bearer'
import dotenv from 'dotenv'

dotenv.config()

// Log these to the terminal to make sure your Mac is reading the .env file
console.log('--- Auth0 Connection Test ---')
console.log('Audience:', process.env.AUTH0_AUDIENCE)
console.log('Issuer:', process.env.AUTH0_ISSUER_BASE_URL)
console.log('-----------------------------')

export const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
  tokenSigningAlg: 'RS256',
})
