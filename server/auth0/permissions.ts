// server/auth0/permissions.ts
import { Request, Response, NextFunction } from 'express'
import knex from '../db/connection.js'

export interface UserRequest extends Request {
  auth?: any
  dbUser?: {
    id: number
    auth_id: string | null // 👈 Changed to allow null for the handshake
    name: string
    email: string
    is_admin: boolean // 👈 ADDED THIS
    is_trusted_orderer: boolean
    has_completed_onboarding: boolean
    // role: string // 👈 YOU CAN REMOVE THIS NOW
  }
}

export async function authorizeUser(
  req: UserRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const authId = req.auth?.payload.sub
    const email = req.auth?.payload.email // Ensure 'email' scope is in Auth0 config

    if (!authId) {
      return res.status(401).json({ message: 'Unauthorized: No valid token.' })
    }

    // 1. Try finding by Auth0 ID (Existing linked users)
    let dbUser = await knex('staff').where('auth_id', authId).first()

    // 2. If not found, try the Email Whitelist (Lazy-Linking)
    if (!dbUser && email) {
      dbUser = await knex('staff').where('email', email).first()

      if (dbUser && !dbUser.auth_id) {
        // 🤝 PERFORM THE HANDSHAKE
        await knex('staff').where('id', dbUser.id).update({ auth_id: authId })
        dbUser.auth_id = authId
        console.log(`🤝 [Auth] Linked ${email} to ${authId}`)
      }
    }

    if (!dbUser) {
      return res.status(403).json({ message: 'Forbidden: Not on manifest.' })
    }

    req.dbUser = dbUser
    next()
  } catch (error) {
    console.error('🔥 [Auth] Middleware Error:', error)
    res.status(500).json({ message: 'Internal Server Error' })
  }
}

export function isOrderer(req: UserRequest, res: Response, next: NextFunction) {
  // 🎯 Updated to use the new boolean logic
  if (req.dbUser?.is_admin || req.dbUser?.is_trusted_orderer) {
    return next()
  }
  res.status(403).json({ message: 'Forbidden: No ordering privileges.' })
}
