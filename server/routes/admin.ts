import express from 'express'
import { checkJwt } from '../auth0/auth.js'
import { authorizeUser, UserRequest } from '../auth0/permissions.js'
import * as db from '../db/settings.js'

const router = express.Router()

// GET: Fetch current global settings
router.get('/settings', checkJwt, authorizeUser, async (req, res) => {
  try {
    const wealth = await db.getWealthLevel()
    res.json({ wealth_level: wealth })
  } catch (error) {
    console.error('Failed to fetch store settings:', error)
    res.status(500).json({ message: 'Internal Server Error' })
  }
})

// PATCH: Update the global wealth level
router.patch(
  '/settings/wealth',
  checkJwt,
  authorizeUser,
  async (req: UserRequest, res) => {
    try {
      const { level } = req.body
      const authId = req.dbUser?.auth_id

      if (!authId) {
        return res.status(401).json({ message: 'Unauthorized' })
      }

      await db.updateWealthLevel(level, authId)
      res.json({ message: `Global wealth level updated to ${level}` })
    } catch (error) {
      console.error('Failed to update wealth level:', error)
      res.status(500).json({ message: 'Internal Server Error' })
    }
  },
)

export default router
