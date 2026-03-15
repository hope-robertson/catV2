import express from 'express'
import { checkJwt } from '../auth0/auth.js'
import { authorizeUser, isOrderer, UserRequest } from '../auth0/permissions.js'
import knex from '../db/connection.js'

const router = express.Router()

// Create a new order header
router.post(
  '/',
  checkJwt,
  authorizeUser,
  isOrderer,
  async (req: UserRequest, res) => {
    try {
      const { distributor, budget_limit, wealth_at_creation } = req.body
      const [newOrderId] = await knex('orders').insert({
        distributor,
        budget_limit,
        wealth_at_creation,
        status: 'draft',
        created_by_auth_id: req.dbUser?.auth_id,
        pct_customer: 0,
        pct_classics: 0,
        pct_risky: 0,
      })
      res.status(201).json({ orderId: newOrderId })
    } catch (error) {
      res.status(500).json({ message: 'Error' })
    }
  },
)

// 🎯 NEW: Add an item to an existing order
router.post(
  '/:id/items',
  checkJwt,
  authorizeUser,
  isOrderer,
  async (req: UserRequest, res) => {
    try {
      const { id } = req.params
      const { master_catalogue_id, quantity, ams_price } = req.body

      await knex('order_items').insert({
        order_id: id,
        master_catalogue_id,
        quantity,
        ams_price,
      })

      res.status(201).json({ message: 'Item added successfully' })
    } catch (error) {
      console.error('[Order Error] Failed to add item:', error)
      res.status(500).json({ message: 'Failed to add item' })
    }
  },
)

export default router
