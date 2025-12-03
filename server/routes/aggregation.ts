// server/routes/aggregation.ts

import { Router, Request, Response } from 'express'
// 🔑 Import the consolidation logic from your catalogue DB file
import { consolidateRawDataToMaster } from '../db/catalogue.js' 

const router = Router()

/**
 * POST /api/v1/aggregation/run
 * * Endpoint to trigger the consolidation of all raw distributor data 
 * into the master_catalogue table.
 * * This replaces the old migration aggregation script.
 */
router.post('/run', async (req: Request, res: Response) => {
  try {
    console.log('--- Aggregation triggered via API route ---')
    
    // Call the existing function from your DB layer
    const totalInserted = await consolidateRawDataToMaster() 

    res.json({ 
      message: `Master catalogue successfully aggregated. Total records: ${totalInserted}`,
      count: totalInserted 
    })
  } catch (error) {
    console.error('Aggregation Error:', error)
    // Use an error handler that logs the error and sends a generic 500
    res
      .status(500)
      .json({ message: 'Failed to aggregate data. Check server logs for details.' })
  }
})

export default router