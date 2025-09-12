// server/auth0/index.ts
import { auth, RequiredAuthProp } from 'express-oauth2-jwt-bearer'
import * as dotenv from 'dotenv'

dotenv.config()

const checkJwt = auth({
  audience: process.env.https://rosscatv2.api,
  issuerBaseURL: process.env.dev-sjiibctd2brp4c18.us.auth0.com,
  tokenSigningAlg: 'RS256',
})

declare global {
  namespace Express {
    export interface Request extends RequiredAuthProp {}
  }
}

export default checkJwt