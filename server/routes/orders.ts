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
        wealth_at_creation: wealth_at_creation || 'ok',
        status: 'active',
        created_by_id: req.dbUser?.id,
        pct_customer: 0,
        pct_classics: 0,
        pct_risky: 0,
      })

      console.log(`🚢 Order #${newOrderId} initialised for ${distributor}`)
      res.status(201).json({ id: newOrderId })
    } catch (error) {
      console.error('🔥 Initialization failed:', error)
      res.status(500).json({ message: 'Error initialising order' })
    }
  },
)

// Add an item to an existing order
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
        staff_id: req.dbUser?.id,
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

// Nuke an existing order
router.delete(
  '/:id',
  checkJwt,
  authorizeUser,
  isOrderer,
  async (req: UserRequest, res) => {
    const { id } = req.params
    try {
      await knex.transaction(async (trx) => {
        await trx('order_items').where('order_id', id).del()
        await trx('orders').where('id', id).del()
      })
      res.json({ message: 'Order and associated items nuked.' })
    } catch (error) {
      console.error('[Order Error] Failed to nuke order:', error)
      res.status(500).json({ message: 'Failed to nuke order' })
    }
  },
)

// 🎯 STATS: Powering the Catalogue HUD
router.get(
  '/:id/stats',
  checkJwt,
  authorizeUser,
  async (req: UserRequest, res) => {
    const { id } = req.params
    try {
      const items = await knex('order_items')
        .where('order_id', id)
        .select('ams_price', 'quantity')

      const total = items.reduce(
        (sum, item) => sum + item.ams_price * item.quantity,
        0,
      )

      // 🎯 THE NEW ADDITION: Count total units ordered
      const count = items.reduce((sum, item) => sum + item.quantity, 0)

      res.json({ total, count })
    } catch (error) {
      console.error('🔥 Stats fetch failed:', error)
      res.status(500).json({ message: 'Error fetching stats' })
    }
  },
)

// Summary for final review
router.get(
  '/:id/summary',
  checkJwt,
  authorizeUser,
  async (req: UserRequest, res) => {
    const { id } = req.params

    try {
      const summary = await knex('order_items')
        .join(
          'master_catalogue',
          'order_items.master_catalogue_id',
          'master_catalogue.id',
        )
        .leftJoin('staff', 'order_items.staff_id', 'staff.id')
        .where('order_items.order_id', id)
        .select(
          'order_items.id as item_id',
          'master_catalogue.artist',
          'master_catalogue.title',
          'order_items.ams_price',
          'master_catalogue.genres',
          'order_items.quantity',
          'staff.name as staff_member',
        )

      const totalCost = summary.reduce(
        (acc, item) => acc + item.ams_price * item.quantity,
        0,
      )
      const totalItems = summary.reduce((acc, item) => acc + item.quantity, 0)

      res.json({
        items: summary,
        stats: {
          totalCost,
          totalItems,
        },
      })
    } catch (error) {
      console.error('🔥 Summary failed:', error)
      res.status(500).json({ message: 'Summary calculation failed' })
    }
  },
)

export default router
