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

// 🎯 Add an item to an existing order
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
        // Delete items first to respect foreign key constraints
        await trx('order_items').where('order_id', id).del()
        // Delete the order header
        await trx('orders').where('id', id).del()
      })
      res.json({ message: 'Order and associated items nuked.' })
    } catch (error) {
      console.error('[Order Error] Failed to nuke order:', error)
      res.status(500).json({ message: 'Failed to nuke order' })
    }
  },
)

export default router

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

      res.json({ total })
    } catch (error) {
      res.status(500).json({ message: 'Error' })
    }
  },
)

// join order_items with master_catalogue to get item details, and calculate summary stats for an order
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

        // track who picked the item
        .leftJoin('staff', 'order_items.staff_id', 'staff.id')
        .where('order_items.order_id', id)
        .select(
          'order_items.id as item_id',
          'master_catalogue.artist',
          'master_catalogue.title',
          'master_catalogue.ams_price',
          'master_catalogue.category',
          'order_items.quantity',
          'staff.name as staff_member',
        )

      // Calculate totals
      const totalCost = summary.reduce(
        (acc, item) => acc + item.ams_price * item.quantity,
        0,
      )
      const riskyCount = summary.filter((i) => i.category === 'risky').length
      const totalItems = summary.length

      res.json({
        items: summary,
        stats: {
          totalCost,
          totalItems,
          bangerRatio: totalItems > 0 ? (riskyCount / totalItems) * 100 : 0,
        },
      })
    } catch (error) {
      res.status(500).json({ message: 'Summary calculation failed' })
    }
  },
)
