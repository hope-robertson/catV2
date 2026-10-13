import express from 'express'
import { checkJwt } from '../auth0/auth.js'
import { authorizeUser, UserRequest } from '../auth0/permissions.js'
import knex from '../db/connection.js'

const router = express.Router()

// GET /api/v1/staff
// Returns all staff members for the admin panel
router.get('/', checkJwt, authorizeUser, async (req: UserRequest, res) => {
  try {
    const staffMembers = await knex('staff').select('*')
    res.json(staffMembers)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch staff list' })
  }
})

// GET /api/v1/staff/me
// Returns the database record for the currently logged-in user
router.get('/me', checkJwt, authorizeUser, (req: UserRequest, res) => {
  // authorizeUser attached the db record to req.dbUser
  if (!req.dbUser) {
    return res.status(404).json({ message: 'Staff profile not found' })
  }

  res.json(req.dbUser)
})

export default router
