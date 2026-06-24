import express, { Response } from 'express'
import { checkJwt } from '../auth0/auth.js'
import { authorizeUser, UserRequest } from '../auth0/permissions.js'
import knex from '../db/connection.js'

const router = express.Router()

// GET /api/v1/wishlist (Get the current user's wishlist)
router.get(
  '/',
  checkJwt,
  authorizeUser,
  async (req: UserRequest, res: Response) => {
    try {
      const staffId = req.dbUser?.id
      if (!staffId) return res.status(403).json({ message: 'Unauthorized' })

      const wishlist = await knex('wishlist_items')
        .join(
          'master_catalogue',
          'wishlist_items.master_catalogue_id',
          'master_catalogue.id',
        )
        .where('wishlist_items.staff_id', staffId)
        .select(
          'wishlist_items.id as wishlist_id',
          'wishlist_items.created_at',
          'master_catalogue.*',
        )
        .orderBy('wishlist_items.created_at', 'desc')

      res.json(wishlist)
    } catch (error) {
      console.error('Failed to fetch wishlist:', error)
      res.status(500).json({ message: 'Failed to fetch wishlist' })
    }
  },
)

// ➕ POST /api/v1/wishlist (Add an item to the wishlist)
router.post(
  '/',
  checkJwt,
  authorizeUser,
  async (req: UserRequest, res: Response) => {
    try {
      const staffId = req.dbUser?.id
      const { master_catalogue_id } = req.body

      if (!staffId) return res.status(403).json({ message: 'Unauthorized' })
      if (!master_catalogue_id)
        return res.status(400).json({ message: 'Missing catalogue ID' })

      // Check if it already exists to prevent duplicates
      const existing = await knex('wishlist_items')
        .where({ staff_id: staffId, master_catalogue_id })
        .first()

      if (existing) {
        return res.status(200).json({ message: 'Item already in wishlist' })
      }

      await knex('wishlist_items').insert({
        staff_id: staffId,
        master_catalogue_id,
      })

      res.status(201).json({ message: 'Added to wishlist' })
    } catch (error) {
      console.error('Failed to add to wishlist:', error)
      res.status(500).json({ message: 'Failed to add to wishlist' })
    }
  },
)

//  DELETE /api/v1/wishlist/:id (Remove an item from the wishlist)
router.delete(
  '/:id',
  checkJwt,
  authorizeUser,
  async (req: UserRequest, res: Response) => {
    try {
      const staffId = req.dbUser?.id
      const { id } = req.params

      if (!staffId) return res.status(403).json({ message: 'Unauthorized' })

      await knex('wishlist_items').where({ id, staff_id: staffId }).del()

      res.json({ message: 'Removed from wishlist' })
    } catch (error) {
      console.error('Failed to remove from wishlist:', error)
      res.status(500).json({ message: 'Failed to remove from wishlist' })
    }
  },
)

export default router
