// server/auth0/permissions.ts
import { Request, Response, NextFunction } from 'express'
import knex from '../db/connection.js'

// This helps TypeScript understand our custom properties
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

    if (!authId) {
      return res.status(401).json({ message: 'Unauthorized: No valid token.' })
    }

    const dbUser = await knex('staff').where('auth_id', authId).first()

    if (!dbUser) {
      return res
        .status(403)
        .json({ message: 'Forbidden: You are not registered as staff.' })
    }

    req.dbUser = dbUser
    next()
  } catch (error) {
    console.error('Database authorization error:', error)
    res.status(500).json({ message: 'Internal Server Error' })
  }
}

// Helper to specifically check for orderers
export function isOrderer(req: UserRequest, res: Response, next: NextFunction) {
  if (req.dbUser?.role === 'admin' || req.dbUser?.is_trusted_orderer) {
    return next()
  }
  res
    .status(403)
    .json({ message: 'Forbidden: You do not have ordering privileges.' })
}
