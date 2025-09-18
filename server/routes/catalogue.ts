// server/routes/catalogue.ts

import { Router, Request, Response } from 'express'
import checkJwt from '../auth0/index.js'
import * as db from '../db/catalogue.js'
import {
  getDistributorConfig,
  getDistributorDataHandler,
} from '../dataHandlers/getDistributorHandler.js'
import path from 'path'
import fs from 'fs'

const router = Router()

router.post('/import', checkJwt, async (req: Request, res: Response) => {
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

    // Get the specific handler for this distributor
    const handler = getDistributorDataHandler(config)

    // Use the handler to process the file and get the data
    const dataToInsert = await handler(filePath, formatType)

    // Now, insert the data into the correct raw table
    const rawTableName = config.rawTableName // Assume the config has a rawTableName property
    const insertedCount = await db.importCatalogueData(
      rawTableName,
      dataToInsert
    )

    res
      .status(200)
      .json({
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
