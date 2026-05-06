import { Router, Request, Response } from 'express'
import * as db from '../db/catalogue.js'
import knex from '../db/connection.js'
import {
  getDistributorConfig,
  getDistributorDataHandler,
} from '../dataHandlers/getDistributorHandler.js'
import { scrubber } from '../utils/scrubber.js'
import path from 'path'
import { checkJwt } from '../auth0/auth.js'

const router = Router()
router.use(checkJwt)

const STAGING_TABLES = [
  'flying_nun_records_limited_raw',
  'border_music_raw',
  'collective_lp_raw',
  'collective_cd_raw',
  'southbound_instock_raw',
  'rhythmethod_group_combined_raw',
]

router.get('/master', async (req: Request, res: Response) => {
  try {
    const results = await db.getMasterCatalogue()
    res.status(200).json(results)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch master catalogue' })
  }
})

router.get('/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string
    const filter = (req.query.filter as string) || 'all'

    if (!query)
      return res.status(400).json({ message: 'Search query required' })

    const results = await db.searchMasterCatalogue(query, filter)
    res.status(200).json(results)
  } catch (error) {
    res.status(500).json({ message: 'Search failed' })
  }
})

router.get('/master-stats', async (req: Request, res: Response) => {
  try {
    const total = await db.getMasterCount()
    res.status(200).json({ total })
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch master stats' })
  }
})

router.post('/import', async (req: Request, res: Response) => {
  try {
    const { filename, distributor: distVal } = req.body
    if (!filename || !distVal)
      return res
        .status(400)
        .json({ message: 'Missing filename or distributor' })

    const config = getDistributorConfig(distVal)
    if (!config) throw new Error('Config not found')

    await db.clearRawTable(config.rawTableName)

    // 🎯 This handler is what reads the Excel file
    const handler = getDistributorDataHandler(config)
    const dataToInsert = await handler(path.resolve('uploads', filename), 'All')

    const insertedCount = await db.importCatalogueData(
      config.rawTableName,
      dataToInsert,
    )

    res.status(200).json({
      message: 'Import successful',
      stagedCount: insertedCount,
      distributor: config.name,
    })
  } catch (error: any) {
    console.error('Import Error:', error)
    res.status(500).json({ message: 'Import failed' })
  }
})

router.post('/consolidate', async (req: Request, res: Response) => {
  try {
    const count = await db.consolidateRawDataToMaster()
    await Promise.all(STAGING_TABLES.map((t) => db.clearRawTable(t)))
    res.status(200).json({ message: 'Consolidation complete', count })
  } catch (error: any) {
    res.status(500).json({ message: 'Consolidation failed' })
  }
})

// --- COLLISION ROUTES ---

router.get('/collisions', async (req: Request, res: Response) => {
  try {
    const results = await knex('master_collisions')
      .select('*')
      .orderBy('id', 'desc')
    res.status(200).json(results)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch collisions' })
  }
})

router.post('/collisions/resolve', async (req: Request, res: Response) => {
  try {
    const { id, action } = req.body
    const item = await knex('master_collisions').where({ id }).first()
    if (!item)
      return res.status(404).json({ message: 'Collision item not found' })

    if (action === 'promote') {
      const { collision_reason, source_table, id: oldId, ...masterData } = item
      await knex('master_catalogue').insert(masterData)
    }

    await knex('master_collisions').where({ id }).del()
    res.status(200).json({ success: true })
  } catch (error) {
    res.status(500).json({ message: 'Resolution failed' })
  }
})

router.post('/clear-staging', async (req: Request, res: Response) => {
  try {
    await Promise.all(STAGING_TABLES.map((t) => db.clearRawTable(t)))
    res.status(200).json({ message: 'Staging cleared' })
  } catch (error) {
    res.status(500).json({ message: 'Clear failed' })
  }
})

// 🎯 PREVIEW STAGING FIX
router.get('/preview-staging', async (req: Request, res: Response) => {
  try {
    const rawData = await db.getAllRawData()

    // Filter out rows that are clearly just headers (where Artist is "Artist" or Price is null)
    const cleanData = rawData.filter(
      (row) => row.artist?.toLowerCase() !== 'artist' && row.price !== null,
    )

    const preview = cleanData.slice(0, 200).map((row) => ({
      original: { artist: row.artist, title: row.title },
      scrubbed: {
        artist: row.artist,
        title: row.title,
        barcode: scrubber.barcode(row.barcode),
        format: row.format,
        price: row.price,
      },
    }))
    res.status(200).json(preview)
  } catch (error) {
    res.status(500).json({ message: 'Preview failed' })
  }
})

export default router
