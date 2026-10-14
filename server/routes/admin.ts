import express, { Response } from 'express'
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

// ➕ ADD NEW STAFF MEMBER BY EMAIL (Admin Action)[cite: 15]
router.post(
  '/staff/invite',
  checkJwt,
  authorizeUser,
  async (req: UserRequest, res: Response | any) => {
    try {
      const { email, name } = req.body
      if (!email) {
        return res.status(400).json({ message: 'Email address is required.' })
      }

      // Check if staff member already exists
      const existing = await knex('staff').where({ email }).first()
      if (existing) {
        return res
          .status(400)
          .json({ message: 'A staff profile with this email already exists.' })
      }

      const staffName = name || email.split('@')[0]

      await knex.transaction(async (trx) => {
        const [insertedId] = await trx('staff').insert({
          name: staffName,
          email,
          is_admin: false,
          is_trusted_orderer: false,
          has_completed_onboarding: false,
        })

        // Add to existing duty rotations queue if needed
        const rotations = await trx('duty_rotations').select(
          'id',
          'queue_order',
        )
        for (const rotation of rotations) {
          const currentQueue: number[] = JSON.parse(
            rotation.queue_order || '[]',
          )
          if (!currentQueue.includes(insertedId)) {
            currentQueue.push(insertedId)
          }
          await trx('duty_rotations')
            .where('id', rotation.id)
            .update({
              queue_order: JSON.stringify(currentQueue),
              updated_at: knex.fn.now(),
            })
        }
      })

      res
        .status(201)
        .json({ message: `Staff member ${email} added successfully.` })
    } catch (error) {
      console.error('🔥 Failed to add staff member:', error)
      res.status(500).json({ message: 'Failed to add staff member.' })
    }
  },
)

// 🗑️ DELETE /api/v1/admin/staff/:id (Remove a staff member from the roster)
router.delete(
  '/staff/:id',
  checkJwt,
  authorizeUser,
  async (req: UserRequest, res: Response | any) => {
    const { id } = req.params
    try {
      await knex('staff').where({ id }).del()
      res.json({ message: 'Staff member removed successfully.' })
    } catch (error) {
      console.error('🔥 Failed to delete staff member:', error)
      res
        .status(500)
        .json({
          message:
            'Failed to delete staff member. Check for dependent records.',
        })
    }
  },
)

// 🏴‍☠️ RECRUITMENT (With Smart Upsert & Auto-Bootstrap)[cite: 15]
router.post('/staff', checkJwt, async (req: any, res) => {
  const { name, email, phone } = req.body
  const authId = req.auth?.payload?.sub

  try {
    await knex.transaction(async (trx) => {
      const adminCountData = await trx('staff')
        .where('is_admin', true)
        .count('id as count')
        .first()
      const noAdminsExist = Number(adminCountData?.count) === 0

      const existingStaff = await trx('staff').where({ email }).first()

      let staffIdToQueue

      if (existingStaff) {
        await trx('staff')
          .where({ id: existingStaff.id })
          .update({
            name,
            phone: phone || existingStaff.phone,
            auth_id: noAdminsExist ? authId : existingStaff.auth_id,
            is_admin: noAdminsExist ? true : existingStaff.is_admin,
            is_trusted_orderer: noAdminsExist
              ? true
              : existingStaff.is_trusted_orderer,
            has_completed_onboarding: noAdminsExist
              ? true
              : existingStaff.has_completed_onboarding,
            updated_at: knex.fn.now(),
          })
        staffIdToQueue = existingStaff.id
      } else {
        const [insertedId] = await trx('staff').insert({
          name,
          email,
          phone: phone || null,
          auth_id: noAdminsExist ? authId : null,
          is_admin: noAdminsExist,
          is_trusted_orderer: noAdminsExist,
          has_completed_onboarding: noAdminsExist,
        })
        staffIdToQueue = insertedId
      }

      const rotations = await trx('duty_rotations').select('id', 'queue_order')

      for (const rotation of rotations) {
        const currentQueue: number[] = JSON.parse(rotation.queue_order || '[]')
        if (!currentQueue.includes(staffIdToQueue)) {
          currentQueue.push(staffIdToQueue)
        }
        await trx('duty_rotations')
          .where('id', rotation.id)
          .update({
            queue_order: JSON.stringify(currentQueue),
            updated_at: knex.fn.now(),
          })
      }
    })

    res
      .status(201)
      .json({ message: 'Crew member recruited/linked successfully.' })
  } catch (error) {
    console.error('🔥 Recruitment failed:', error)
    res
      .status(500)
      .json({ message: 'Recruitment failed: Database sync error.' })
  }
})

router.patch('/staff/:id', checkJwt, authorizeUser, async (req, res) => {
  const { id } = req.params
  try {
    await knex('staff').where({ id }).update(req.body)
    res.json({ message: 'Staff record updated' })
  } catch (error) {
    res.status(500).json({ message: 'Update failed' })
  }
})

export default router
