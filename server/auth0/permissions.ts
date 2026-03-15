// server/auth0/permissions.ts
import { Request, Response, NextFunction } from 'express'
import knex from '../db/connection.js'

export interface UserRequest extends Request {
  auth?: any
  dbUser?: {
    id: number
    auth_id: string
    role: string
    is_trusted_orderer: boolean
    has_completed_onboarding: boolean
  }
}

export async function authorizeUser(
  req: UserRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const authId = req.auth?.payload.sub
    console.log('🛡️ [Auth] Checking ID:', authId)

    if (!authId) {
      console.log('⚠️ [Auth] No sub in token')
      return res.status(401).json({ message: 'Unauthorized: No valid token.' })
    }

    const dbUser = await knex('staff').where('auth_id', authId).first()

    if (!dbUser) {
      console.log('🚫 [Auth] ID not found in database. Check your seeds!')
      return res.status(403).json({ message: 'Forbidden: Not registered.' })
    }

    console.log('👤 [Auth] User Found:', dbUser.name, '| Role:', dbUser.role)
    req.dbUser = dbUser
    next()
  } catch (error) {
    console.error('🔥 [Auth] DB Error:', error)
    res.status(500).json({ message: 'Internal Server Error' })
  }
}

export function isOrderer(req: UserRequest, res: Response, next: NextFunction) {
  if (req.dbUser?.role === 'admin' || req.dbUser?.is_trusted_orderer) {
    return next()
  }
  res.status(403).json({ message: 'Forbidden: No ordering privileges.' })
}
