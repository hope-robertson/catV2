// server/routes/upload.ts

import { Router, Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs' // 👈 NEW: Import file system module

const router = Router()

// --------------------- Multer Setup (No Change) ---------------------
// Define the storage configuration for Multer
const storage = multer.diskStorage({
  // Destination function tells Multer where to save the file (Project Root/uploads)
  destination: (req, file, cb) => {
    cb(null, path.resolve('uploads'))
  },
  // Filename function determines the name of the file (Use Original Name)
  filename: (req, file, cb) => {
    cb(null, file.originalname)
  },
})
const upload = multer({ storage: storage })

// --------------------- 1. File Upload Endpoint (POST /api/v1/upload) ---------------------
router.post('/', upload.single('stockFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' })
  }
  
  // The file is saved using its original name.
  res.status(200).json({
    message: 'File successfully uploaded.',
    filename: req.file.filename, // This is the original name
  })
})

// --------------------- 2. File Rename Endpoint (POST /api/v1/upload/rename) ---------------------
/**
 * POST /api/v1/upload/rename
 * Accepts an original file name and a new file name and renames the file 
 * in the 'uploads' directory.
 */
router.post('/rename', (req: Request, res: Response) => {
  const { originalFilename, newFilename } = req.body

  if (!originalFilename || !newFilename) {
    return res.status(400).json({
      message: 'Both originalFilename and newFilename are required for renaming.',
    })
  }
  
  // Construct the full paths
  const oldPath = path.resolve('uploads', originalFilename)
  const newPath = path.resolve('uploads', newFilename)

  // CRITICAL: Check if the original file exists before trying to rename it
  if (!fs.existsSync(oldPath)) {
    return res.status(404).json({
      message: `File not found: ${originalFilename}. Upload it first.`,
    })
  }

  try {
    // Rename the file on the file system
    fs.renameSync(oldPath, newPath)
    
    res.status(200).json({
      message: `File successfully renamed from ${originalFilename} to ${newFilename}.`,
      filename: newFilename, // Return the new name for the client to use in the import step
    })
  } catch (error) {
    console.error('File rename error:', error)
    res.status(500).json({ message: 'Failed to rename file.' })
  }
})

export default router