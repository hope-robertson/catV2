// server/utils/auth.ts

import { auth } from 'express-oauth2-jwt-bearer'
import { RequestHandler } from 'express' // Import the RequestHandler type for correct typing

/**
 * Initializes and returns the Auth0 JWT middleware.
 * This function MUST be called AFTER dotenv.config() has loaded environment variables.
 * @returns An Express RequestHandler middleware function.
 */
export function initializeCheckJwt(): RequestHandler {
  return auth({
    audience: process.env.AUTH_AUDIENCE,
    issuerBaseURL: process.env.AUTH_ISSUER_BASE_URL,
    tokenSigningAlg: 'RS256',
  })
}
