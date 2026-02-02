import { Router, Request, Response } from 'express'
import * as db from '../db/catalogue.js'
import {
  getDistributorConfig,
  getDistributorDataHandler,
} from '../dataHandlers/getDistributorHandler.js'
import { scrubber } from '../utils/scrubber.js'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { checkJwt } from '../auth0/auth.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const router = Router()

// 🔒 Global Security: Require login for all catalogue operations
router.use(checkJwt)

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
    const { filename, distributor: distributorValue } = req.body
    const formatType = (req.query.formatType || 'All') as 'LP' | 'CD' | 'All'

    if (!filename || !distributorValue) {
      return res
        .status(400)
        .json({ message: 'Filename and distributor are required.' })
    }

    // 🔍 Diagnostics: Resolve path from project root
    const uploadDir = path.resolve('uploads')
    const filePath = path.join(uploadDir, filename)

    console.log('--- IMPORT DIAGNOSTICS ---')
    console.log('Looking for:', filename)
    console.log('Full Path:', filePath)

    if (!fs.existsSync(filePath)) {
      console.error('❌ FILE NOT FOUND IN UPLOADS')
      console.log('Current Uploads Dir Contains:', fs.readdirSync(uploadDir))
      return res
        .status(404)
        .json({ message: `File not found in uploads: ${filename}` })
    }

    const config = getDistributorConfig(distributorValue)
    if (!config) {
      return res
        .status(400)
        .json({ message: `Invalid distributor: ${distributorValue}` })
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
    console.error('Import error:', error)
    res
      .status(500)
      .json({ message: 'An unexpected error occurred during import.' })
  }
})

// --- CONSOLIDATION ROUTE ---
router.post('/consolidate', async (req: Request, res: Response) => {
  try {
    const rawData = await db.getAllRawData()

    if (!rawData || rawData.length === 0) {
      return res
        .status(400)
        .json({ message: 'No data in staging to consolidate.' })
    }

    const cleanData = rawData.map((row: any) => ({
      artist: scrubber.artist(row.artist),
      title: scrubber.text(row.title),
      barcode: scrubber.barcode(row.barcode),
      format: scrubber.text(row.format),
      is_nz_music: scrubber.boolean(row.is_nz_music),
      source_distributor: row.distributor || 'Unknown',
      rating: 0,
      last_imported_at: new Date(),
    }))

    const count = await db.insertToMaster(cleanData)
    res
      .status(200)
      .json({
        message: `Successfully scrubbed and moved ${count} records.`,
        count,
      })
  } catch (error) {
    console.error('Consolidation error:', error)
    res.status(500).json({ message: 'Failed to consolidate data.' })
  }
})

// --- PREVIEW ROUTE ---
router.get('/preview-staging', async (req: Request, res: Response) => {
  try {
    const rawData = await db.getAllRawData()
    const preview = rawData.slice(0, 50).map((row: any) => ({
      original: {
        artist: row.artist,
        title: row.title,
        barcode: row.barcode,
        format: row.format,
        is_nz: row.is_nz_music,
      },
      scrubbed: {
        artist: scrubber.artist(row.artist),
        title: scrubber.text(row.title),
        barcode: scrubber.barcode(row.barcode),
        format: scrubber.text(row.format),
        is_nz: scrubber.boolean(row.is_nz_music),
      },
    }))
    res.status(200).json(preview)
  } catch (error) {
    console.error('Preview error:', error)
    res.status(500).json({ message: 'Failed to generate preview.' })
  }
})

export default router
