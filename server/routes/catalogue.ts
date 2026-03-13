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

router.post('/import', async (req: Request, res: Response) => {
  try {
    const { filename, distributor: distVal } = req.body
    const formatType = (req.query.formatType || 'All') as 'LP' | 'CD' | 'All'
    if (!filename || !distVal)
      return res
        .status(400)
        .json({ message: 'Missing filename or distributor' })
    const filePath = path.resolve('uploads', filename)
    if (!fs.existsSync(filePath))
      return res.status(404).json({ message: 'File not found' })
    const config = getDistributorConfig(distVal)
    if (!config) throw new Error('Config not found')
    console.log(`[Import] Clearing staging table: ${config.rawTableName}`)
    await db.clearRawTable(config.rawTableName)
    const handler = getDistributorDataHandler(config)
    const dataToInsert = await handler(filePath, formatType)
    console.log(
      `[Import] Inserting ${dataToInsert.length} rows into ${config.rawTableName}`,
    )
    const insertedCount = await db.importCatalogueData(
      config.rawTableName,
      dataToInsert,
    )
    res
      .status(200)
      .json({
        message: 'Import successful',
        stagedCount: insertedCount,
        distributor: config.name,
      })
  } catch (error: any) {
    console.error('[Import Error]', error.message)
    res.status(500).json({ message: 'Import failed' })
  }
})

router.post('/consolidate', async (req: Request, res: Response) => {
  try {
    console.log('[Route] Consolidation triggered...')
    const count = await db.consolidateRawDataToMaster()
    if (count === 0)
      return res.status(400).json({ message: 'Staging is empty' })
    res.status(200).json({ message: 'Consolidation complete', count })
  } catch (error) {
    console.error('[Route Error] Consolidation failed')
    res.status(500).json({ message: 'Consolidation failed' })
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
    res.status(500).json({ message: 'Preview failed' })
  }
})

export default router
