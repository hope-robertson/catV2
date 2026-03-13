import { Router, Request, Response } from 'express'
import * as db from '../db/catalogue.js'
import {
  getDistributorConfig,
  getDistributorDataHandler,
} from '../dataHandlers/getDistributorHandler.js'
import { scrubber } from '../utils/scrubber.js'
import path from 'path'
import fs from 'fs'
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

router.get('/master-stats', async (req: Request, res: Response) => {
  try {
    const total = await db.getMasterCount()
    res.status(200).json({ total })
  } catch (error) {
    console.error('Master stats error:', error)
    res.status(500).json({ message: 'Failed to fetch master stats' })
  }
})

router.post('/import', async (req: Request, res: Response) => {
  try {
    const { filename, distributor: distVal } = req.body
    const formatType = (req.query.formatType || 'All') as 'LP' | 'CD' | 'All'

    if (!filename || !distVal)
      return res
        .status(400)
        .json({ message: 'Missing filename or distributor' })

    const lowerFile = filename.toLowerCase()
    const lowerDistKeyword = distVal.toLowerCase().split(' ')[0]

    if (!lowerFile.includes(lowerDistKeyword)) {
      return res.status(400).json({
        message: `Filename Mismatch: Selected '${distVal}' but file is '${filename}'.`,
      })
    }

    const filePath = path.resolve('uploads', filename)
    if (!fs.existsSync(filePath))
      return res.status(404).json({ message: 'File not found' })

    const config = getDistributorConfig(distVal)
    if (!config) throw new Error('Config not found')

    await db.clearRawTable(config.rawTableName)

    const handler = getDistributorDataHandler(config)
    const dataToInsert = await handler(filePath, formatType)

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
    console.error('Import process error:', error)
    res.status(500).json({ message: 'Import failed' })
  }
})

router.post('/consolidate', async (req: Request, res: Response) => {
  try {
    const count = await db.consolidateRawDataToMaster()

    if (count === 0)
      return res.status(400).json({ message: 'Staging is empty' })

    // Auto-clear all staging tables after successful merge
    await Promise.all(STAGING_TABLES.map((t) => db.clearRawTable(t)))

    res
      .status(200)
      .json({ message: 'Consolidation complete and staging cleared', count })
  } catch (error: any) {
    console.error('Consolidation error:', error)
    res.status(500).json({ message: 'Consolidation failed' })
  }
})

router.post('/clear-staging', async (req: Request, res: Response) => {
  try {
    await Promise.all(STAGING_TABLES.map((t) => db.clearRawTable(t)))
    res.status(200).json({ message: 'Staging cleared' })
  } catch (error) {
    console.error('Staging clear error:', error)
    res.status(500).json({ message: 'Clear failed' })
  }
})

router.get('/preview-staging', async (req: Request, res: Response) => {
  try {
    const rawData = await db.getAllRawData()
    const preview = rawData.slice(0, 200).map((row) => ({
      original: { artist: row.artist, title: row.title },
      scrubbed: {
        artist: row.artist,
        title: row.title,
        barcode: scrubber.barcode(row.barcode),
        format: scrubber.text(row.format),
        price: row.price,
      },
    }))
    res.status(200).json(preview)
  } catch (error) {
    console.error('Preview error:', error)
    res.status(500).json({ message: 'Preview failed' })
  }
})

export default router
