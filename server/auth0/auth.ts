// server/auth0/auth.ts
import { auth } from 'express-oauth2-jwt-bearer'

export const checkJwt = auth({
  issuerBaseURL: `https://dev-sjiibctd2brp4c18.us.auth0.com/`,
  audience: 'https://rosscatv2.api',
  tokenSigningAlg: 'RS256',
})
