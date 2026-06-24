import express from 'express'
import { checkJwt } from '../auth0/auth.js'
import { authorizeUser, UserRequest } from '../auth0/permissions.js'
import knex from '../db/connection.js'
import * as db from '../db/settings.js'

const router = express.Router()

// --- STORE SETTINGS (Wealth & Bills) ---

router.get('/settings', checkJwt, authorizeUser, async (req, res) => {
  try {
    const settings = await knex('store_settings').select('*')
    res.json({ settings })
  } catch (error) {
    console.error('Failed to fetch store settings:', error)
    res.status(500).json({ message: 'Internal Server Error' })
  }
})

router.patch(
  '/settings/expense',
  checkJwt,
  authorizeUser,
  async (req: UserRequest, res) => {
    try {
      const { key, value } = req.body
      const authId = req.dbUser?.auth_id

      await knex('store_settings').where({ key }).update({
        value: value.toString(),
        updated_by_auth_id: authId,
        updated_at: knex.fn.now(),
      })

      res.json({ message: `${key} updated to ${value}` })
    } catch (error) {
      res.status(500).json({ message: 'Failed to update expense' })
    }
  },
)

router.patch(
  '/settings/wealth',
  checkJwt,
  authorizeUser,
  async (req: UserRequest, res) => {
    try {
      const { level } = req.body
      const authId = req.dbUser?.auth_id
      if (!authId) return res.status(401).json({ message: 'Unauthorized' })

      await db.updateWealthLevel(level, authId)
      res.json({ message: `Global wealth level updated to ${level}` })
    } catch (error) {
      console.error('Failed to update wealth level:', error)
      res.status(500).json({ message: 'Internal Server Error' })
    }
  },
)

// --- CREW MANIFESTO (Staff Management) ---

router.get('/staff', checkJwt, authorizeUser, async (req, res) => {
  try {
    const staff = await knex('staff').select('*').orderBy('name', 'asc')
    res.json(staff)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch crew manifest' })
  }
})

// 🏴‍☠️ RECRUITMENT (With Auto-Bootstrap Mechanism)
router.post(
  '/staff',
  checkJwt,
  // 🎯 Removed authorizeUser here so the first account can be created
  async (req: any, res) => {
    const { name, email, phone } = req.body
    // Auth0 attaches the user's ID to req.auth.payload.sub via checkJwt
    const authId = req.auth?.payload?.sub

    try {
      // 🔗 TRANSACTION: All succeeds or all fails
      await knex.transaction(async (trx) => {
        // 🎯 Check if the database is empty (is this the first user?)
        const staffCountData = await trx('staff').count('id as count').first()
        const isFirstUser = Number(staffCountData?.count) === 0

        // 1. Add to Staff Table
        const [newStaffId] = await trx('staff').insert({
          name,
          email,
          phone: phone || null,
          // If first user, link their Auth0 ID and promote them automatically!
          auth_id: isFirstUser ? authId : null,
          is_admin: isFirstUser,
          is_trusted_orderer: isFirstUser,
          has_completed_onboarding: isFirstUser,
        })

        // 2. Fetch existing rotations (Rostering, Ordering, etc.)
        const rotations = await trx('duty_rotations').select(
          'id',
          'queue_order',
        )

        // 3. Inject new pirate into every active queue
        for (const rotation of rotations) {
          // Parse the existing queue or start empty
          const currentQueue: number[] = JSON.parse(
            rotation.queue_order || '[]',
          )

          // Add new ID to the end of the line
          if (!currentQueue.includes(newStaffId)) {
            currentQueue.push(newStaffId)
          }

          await trx('duty_rotations')
            .where('id', rotation.id)
            .update({
              queue_order: JSON.stringify(currentQueue),
              updated_at: knex.fn.now(),
            })
        }
      })

      console.log(
        `✅ Recruitment Complete: ${name} added to manifest and rotations.`,
      )
      res
        .status(201)
        .json({ message: 'New crew member recruited and added to rotations.' })
    } catch (error) {
      console.error('🔥 Recruitment failed:', error)
      res
        .status(500)
        .json({ message: 'Recruitment failed: Database sync error.' })
    }
  },
)

router.patch('/staff/:id', checkJwt, authorizeUser, async (req, res) => {
  const { id } = req.params
  try {
    await knex('staff').where('id', id).update(req.body)
    res.json({ message: 'Staff record updated' })
  } catch (error) {
    res.status(500).json({ message: 'Update failed' })
  }
})

export default router
