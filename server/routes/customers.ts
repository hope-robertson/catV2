import express, { Response } from 'express'
import { checkJwt } from '../auth0/auth.js'
import { checkPermissions, AuthRequest } from '../middleware/auth.js'
import knex from '../db/connection.js'

const router = express.Router()

// 🔍 GET /api/v1/customers/search (Find existing customers by name/phone)
router.get(
  '/search',
  checkJwt,
  checkPermissions,
  async (req: AuthRequest, res: Response) => {
    try {
      const q = (req.query.q as string) || ''
      if (!q) return res.json([])

      const customers = await knex('customers')
        .where('name', 'like', `%${q}%`)
        .orWhere('phone', 'like', `%${q}%`)
        .limit(10)

      res.json(customers)
    } catch (error) {
      res.status(500).json({ message: 'Failed to search customers' })
    }
  },
)

// 👤 POST /api/v1/customers (Create a new customer)
router.post(
  '/',
  checkJwt,
  checkPermissions,
  async (req: AuthRequest, res: Response) => {
    try {
      const { name, phone, email } = req.body

      // Non-negotiable check
      if (!name || !phone) {
        return res
          .status(400)
          .json({ message: 'Name and Phone are strictly required.' })
      }

      const [newIds] = await knex('customers')
        .insert({ name, phone, email })
        .returning('id')
      // Handle both array returns (Postgres) and single id returns (SQLite/MySQL)
      const newId = typeof newIds === 'object' ? newIds.id : newIds

      res.status(201).json({ id: newId, name, phone, email })
    } catch (error) {
      res.status(500).json({ message: 'Failed to create customer' })
    }
  },
)

// 📦 POST /api/v1/customers/:customerId/orders (Create the Docket + Items)
router.post(
  '/:customerId/orders',
  checkJwt,
  checkPermissions,
  async (req: AuthRequest, res: Response) => {
    const { customerId } = req.params
    const { items, notes } = req.body
    const staffId = req.dbUser?.id

    if (!staffId) return res.status(403).json({ message: 'Staff ID missing' })
    if (!items || items.length === 0)
      return res.status(400).json({ message: 'No items in order' })

    // 🔒 Transaction: If the items fail, the docket rolls back so you don't get empty ghosts
    const trx = await knex.transaction()

    try {
      // 1. Create the Docket
      const [orderIds] = await trx('customer_orders')
        .insert({
          customer_id: customerId,
          staff_id: staffId, // Locks in who processed it
          notes,
          status: 'pending',
        })
        .returning('id')

      const docketId = typeof orderIds === 'object' ? orderIds.id : orderIds

      // 2. Prep the Items
      const itemsToInsert = items.map((item: any) => ({
        customer_order_id: docketId,
        master_catalogue_id: item.master_catalogue_id,
        quantity: item.quantity || 1,
        quoted_price: item.quoted_price,
        base_usd_price: item.base_usd_price || null,
        exchange_rate_used: item.exchange_rate_used || null,
      }))

      // 3. Insert the Items
      await trx('customer_order_items').insert(itemsToInsert)

      await trx.commit()
      res.status(201).json({ message: 'Customer order locked in', docketId })
    } catch (error) {
      await trx.rollback()
      console.error('Failed to save customer docket:', error)
      res.status(500).json({ message: 'Failed to save customer order' })
    }
  },
)

// 📋 GET /api/v1/customers/orders/active (Fetch pending orders for the dashboard)
router.get(
  '/orders/active',
  checkJwt,
  checkPermissions,
  async (req: AuthRequest, res: Response) => {
    try {
      const activeOrders = await knex('customer_orders')
        .join('customers', 'customer_orders.customer_id', 'customers.id')
        .join('staff', 'customer_orders.staff_id', 'staff.id')
        .whereIn('customer_orders.status', ['pending', 'ordered', 'arrived'])
        .select(
          'customer_orders.id as docket_id',
          'customer_orders.status',
          'customer_orders.created_at',
          'customers.name as customer_name',
          'customers.phone',
          'staff.name as clerk_name',
          // Assuming the new migration has been run, you might want to pull these fields too
          'customer_orders.is_texted',
          'customer_orders.is_confirmed',
          'customer_orders.is_ordered',
          'customer_orders.is_contacted',
          'customer_orders.is_picked_up',
          'customer_orders.is_backburner',
        )
        .orderBy('customer_orders.created_at', 'desc')

      res.json(activeOrders)
    } catch (error) {
      res
        .status(500)
        .json({ message: 'Failed to fetch active customer orders' })
    }
  },
)

// 🎯 PATCH /api/v1/customers/orders/:docketId (Update status flags from spreadsheet)
router.patch(
  '/orders/:docketId',
  checkJwt,
  checkPermissions,
  async (req: AuthRequest, res: Response) => {
    try {
      const { docketId } = req.params

      // Extract only the boolean flags from the request body to prevent overriding other data
      const {
        is_texted,
        is_confirmed,
        is_ordered,
        is_contacted,
        is_picked_up,
        is_backburner,
      } = req.body

      const updates: any = {}
      if (is_texted !== undefined) updates.is_texted = is_texted
      if (is_confirmed !== undefined) updates.is_confirmed = is_confirmed
      if (is_ordered !== undefined) updates.is_ordered = is_ordered
      if (is_contacted !== undefined) updates.is_contacted = is_contacted
      if (is_picked_up !== undefined) updates.is_picked_up = is_picked_up
      if (is_backburner !== undefined) updates.is_backburner = is_backburner

      // Update the timestamp whenever a flag is changed
      updates.updated_at = knex.fn.now()

      await knex('customer_orders').where('id', docketId).update(updates)

      res.json({ message: 'Order flags updated' })
    } catch (error) {
      console.error('Failed to update order flags:', error)
      res.status(500).json({ message: 'Failed to update order status' })
    }
  },
)

export default router
