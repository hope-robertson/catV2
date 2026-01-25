import { Router, Request, Response } from 'express'
import * as db from '../db/catalogue.js'
import {
  getDistributorConfig,
  getDistributorDataHandler,
} from '../dataHandlers/getDistributorHandler.js'
import { scrubber } from '../utils/scrubber.js' // Added Scrubber import
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const router = Router()

// --- SEARCH ROUTE ---
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
router.patch('/rating', async (req: Request, res: Response) => {
  try {
    const { id, rating } = req.body

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

// --- IMPORT ROUTE (File to Staging) ---
router.post('/import', async (req: Request, res: Response) => {
  try {
    const filename = req.body.filename as string
    const distributorValue = req.body.distributor as string
    const formatType = (req.query.formatType || 'All') as 'LP' | 'CD' | 'All'

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

// --- CONSOLIDATION ROUTE (Staging to Master) ---
router.post('/consolidate', async (req: Request, res: Response) => {
  try {
    // 1. Fetch all raw data from staging
    const rawData = await db.getAllRawData()

    if (!rawData || rawData.length === 0) {
      return res
        .status(400)
        .json({ message: 'No data in staging to consolidate.' })
    }

    // 2. Scrub and Map
    const cleanData = rawData.map((row: any) => ({
      artist: scrubber.artist(row.artist),
      title: scrubber.text(row.title),
      barcode: scrubber.barcode(row.barcode),
      format: scrubber.text(row.format),
      is_nz_music: scrubber.boolean(row.is_nz_music),
      distributor: row.distributor || 'Unknown',
      rating: 0,
    }))

    // 3. Move to Master
    const count = await db.insertToMaster(cleanData)

    res.status(200).json({
      message: `Successfully scrubbed and moved ${count} records to Master Catalogue.`,
      count,
    })
  } catch (error) {
    console.error('Consolidation error:', error)
    res.status(500).json({ message: 'Failed to consolidate data.' })
  }
})

export default router
