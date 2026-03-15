// server/middleware/auth.ts
import { Request, Response, NextFunction } from 'express'
import knex from '../db/connection.js'

// Extend the Request type to include our custom staff data
export interface AuthRequest extends Request {
  user?: any // The Auth0 raw user
  dbUser?: {
    id: number
    role: string
    is_trusted_orderer: boolean
    has_completed_onboarding: boolean
  }
}

export async function checkPermissions(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    // 1. Get the Auth0 ID from the token (provided by express-oauth2-jwt-bearer)
    const authId = req.auth?.payload.sub

    if (!authId) {
      return res.status(401).json({ message: 'Unauthorized: No token found' })
    }

    // 2. Look up the user in our 'staff' table
    const dbUser = await knex('staff').where('auth_id', authId).first()

    if (!dbUser) {
      return res
        .status(403)
        .json({ message: 'Forbidden: User not found in staff records' })
    }

    // 3. Attach the DB user info to the request for use in the route
    req.dbUser = dbUser
    next()
  } catch (error) {
    console.error('Permission check failed:', error)
    res.status(500).json({ message: 'Internal Server Error' })
  }
}

// Specialized check for Order Creators
export function canCreateOrders(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  if (req.dbUser?.role === 'admin' || req.dbUser?.is_trusted_orderer) {
    return next()
  }
  return res
    .status(403)
    .json({ message: 'Access Denied: Elevated ordering privileges required.' })
}
