import { Router, Request, Response } from 'express'
import * as db from '../db/catalogue.js'
import {
  getDistributorConfig,
  getDistributorDataHandler,
} from '../dataHandlers/getDistributorHandler.js'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const router = Router()

// --- SEARCH ROUTE ---
// GET /api/v1/catalogue/search?query=pink&filter=all
router.get('/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.query as string
    const filter = (req.query.filter as string) || 'all'

    if (!query) {
      return res.status(400).json({ message: 'Search query is required.' })
    }

    const results = await db.searchMasterCatalogue(query, filter)
    res.status(200).json(results)
  } catch (error) {
    console.error('Search error:', error)
    res.status(500).json({ message: 'Error performing search.' })
  }
})

// --- RATING UPDATE ROUTE ---
// PATCH /api/v1/catalogue/rating
router.patch('/rating', async (req: Request, res: Response) => {
  try {
    const { id, rating } = req.body // id of the record and the new rating (0-3)

    if (id === undefined || rating === undefined) {
      return res.status(400).json({ message: 'ID and rating are required.' })
    }

    await db.updateRecordRating(Number(id), Number(rating))
    res.status(200).json({ message: 'Rating updated successfully.' })
  } catch (error) {
    console.error('Update rating error:', error)
    res.status(500).json({ message: 'Error updating rating.' })
  }
})

// --- IMPORT ROUTE (Existing) ---
router.post('/import', async (req: Request, res: Response) => {
  try {
    const filename = req.body.filename as string
    const distributorValue = req.body.distributor as string
    const formatType = (req.body.formatType || 'All') as 'LP' | 'CD' | 'All'

    if (!filename || !distributorValue) {
      return res
        .status(400)
        .json({ message: 'Filename and distributor are required.' })
    }

    const filePath = path.join(__dirname, '..', '..', 'uploads', filename)
    const fileExists = fs.existsSync(filePath)
    if (!fileExists) {
      return res.status(404).json({ message: `File not found: ${filename}` })
    }

    const config = getDistributorConfig(distributorValue)
    if (!config) {
      return res
        .status(400)
        .json({ message: `Invalid distributor value: ${distributorValue}` })
    }

    const handler = getDistributorDataHandler(config)
    const dataToInsert = await handler(filePath, formatType)

    const rawTableName = config.rawTableName
    const insertedCount = await db.importCatalogueData(
      rawTableName,
      dataToInsert,
    )

    res.status(200).json({
      message: `Successfully imported ${insertedCount} records from ${config.name}.`,
    })
  } catch (error) {
    console.error('An error occurred during import:', error)
    res
      .status(500)
      .json({ message: 'An unexpected error occurred during import.' })
  }
})

export default router
