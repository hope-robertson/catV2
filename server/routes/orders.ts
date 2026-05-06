import express, { Response } from 'express' // 🎯 Explicitly import Response
import { checkJwt } from '../auth0/auth.js'
import { authorizeUser, isOrderer, UserRequest } from '../auth0/permissions.js'
import knex from '../db/connection.js'

const router = express.Router()

// GET all active orders for the Hub
router.get(
  '/',
  checkJwt,
  authorizeUser,
  async (req: UserRequest, res: Response) => {
    try {
      const orders = await knex('orders')
        .whereNot('status', 'finalized')
        .orderBy('created_at', 'desc')
      res.json(orders)
    } catch (error) {
      res.status(500).json({ message: 'Error fetching orders' })
    }
  },
)

// GET single order for the Catalogue context
// 🎯 FIXED: Changed generic Request to UserRequest
router.get(
  '/:id',
  checkJwt,
  authorizeUser,
  async (req: UserRequest, res: Response) => {
    try {
      const order = await knex('orders').where('id', req.params.id).first()
      if (!order) return res.status(404).json({ message: 'Order not found' })
      res.json(order)
    } catch (error) {
      res.status(500).json({ message: 'Error fetching order' })
    }
  },
)

// PATCH update for Budget Slider and Session Name
router.patch(
  '/:id',
  checkJwt,
  authorizeUser,
  isOrderer,
  async (req: UserRequest, res: Response) => {
    try {
      const { name, budget_limit, status } = req.body
      await knex('orders').where('id', req.params.id).update({
        name,
        budget_limit,
        status,
        updated_at: knex.fn.now(),
      })
      res.json({ message: 'Order updated' })
    } catch (error) {
      res.status(500).json({ message: 'Update failed' })
    }
  },
)

// POST create new order
router.post(
  '/',
  checkJwt,
  authorizeUser,
  isOrderer,
  async (req: UserRequest, res: Response) => {
    try {
      const { name, distributor, budget_limit } = req.body
      const [newOrderId] = await knex('orders').insert({
        name: name || null,
        distributor,
        budget_limit,
        status: 'active',
        created_by_id: req.dbUser?.id,
      })
      res.status(201).json({ id: newOrderId })
    } catch (error) {
      res.status(500).json({ message: 'Init failed' })
    }
  },
)

// POST add item to order
router.post(
  '/:id/items',
  checkJwt,
  authorizeUser,
  isOrderer,
  async (req: UserRequest, res: Response) => {
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
      res.status(201).json({ message: 'Item added' })
    } catch (error) {
      res.status(500).json({ message: 'Add failed' })
    }
  },
)

// GET Stats for the HUD
// 🎯 FIXED: Changed generic Request to UserRequest
router.get(
  '/:id/stats',
  checkJwt,
  authorizeUser,
  async (req: UserRequest, res: Response) => {
    const { id } = req.params
    try {
      const items = await knex('order_items')
        .where('order_id', id)
        .select('ams_price', 'quantity')
      const total = items.reduce(
        (sum, item) => sum + item.ams_price * item.quantity,
        0,
      )
      const count = items.reduce((sum, item) => sum + item.quantity, 0)
      res.json({ total, count })
    } catch (error) {
      res.status(500).json({ message: 'Stats error' })
    }
  },
)

// GET Summary for Review
// 🎯 FIXED: Changed generic Request to UserRequest
router.get(
  '/:id/summary',
  checkJwt,
  authorizeUser,
  async (req: UserRequest, res: Response) => {
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
          'order_items.quantity',
          'staff.name as staff_member',
        )
      const totalCost = summary.reduce(
        (acc, item) => acc + item.ams_price * item.quantity,
        0,
      )
      res.json({
        items: summary,
        stats: { totalCost, totalItems: summary.length },
      })
    } catch (error) {
      res.status(500).json({ message: 'Summary error' })
    }
  },
)

export default router
