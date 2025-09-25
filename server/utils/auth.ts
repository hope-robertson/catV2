// server/utils/auth.ts

import { auth } from 'express-oauth2-jwt-bearer'

// This middleware checks if the JWT is valid based on your Auth0 environment variables.
export const checkJwt = auth({
  // The 'audience' is the unique identifier for your API (e.g., 'https://rosscatv2.api').
  // This is read from your .env file as AUTH_AUDIENCE.
  audience: process.env.AUTH_AUDIENCE,

  // The 'issuerBaseURL' is the base URL of your Auth0 tenant.
  // This is read from your .env file as AUTH_ISSUER_BASE_URL.
  issuerBaseURL: process.env.AUTH_ISSUER_BASE_URL,

  // 'tokenSigningAlg' is the algorithm used to sign the token. RS256 is the default for Auth0.
  tokenSigningAlg: 'RS256',
})

// Note: You must have 'express-oauth2-jwt-bearer' installed for this to work.
// If not, run: npm install express-oauth2-jwt-bearer
