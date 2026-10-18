import express, { Response } from 'express'
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

// PATCH /api/v1/staff/:id
// Updates staff record (e.g., toggling admin or trusted orderer status)
router.patch(
  '/:id',
  checkJwt,
  authorizeUser,
  async (req: UserRequest, res: Response | any) => {
    const { id } = req.params
    const { is_admin, is_trusted_orderer } = req.body

    try {
      const updatedFields: any = {
        updated_at: knex.fn.now(),
      }

      if (is_admin !== undefined) {
        updatedFields.is_admin = is_admin
        // 🎯 Enforce rule: All admins are automatically trusted orderers
        if (is_admin) {
          updatedFields.is_trusted_orderer = true
        }
      }

      if (is_trusted_orderer !== undefined) {
        // Only override if is_admin wasn't explicitly turning them into an admin
        if (!updatedFields.is_admin) {
          updatedFields.is_trusted_orderer = is_trusted_orderer
        }
      }

      await knex('staff').where({ id }).update(updatedFields)

      res.json({ message: 'Staff record updated successfully' })
    } catch (error: any) {
      console.error('🔥 Failed to update staff record:', error.message)
      res.status(500).json({ message: 'Update failed', error: error.message })
    }
  },
)

export default router
