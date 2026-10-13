// server/routes/upload.ts

import { Router, Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

const router = Router()

// --------------------- Multer Setup ---------------------
// Ensure the uploads directory exists synchronously on startup
const uploadDir = path.resolve('uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// Define the storage configuration for Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
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

  res.status(200).json({
    message: 'File successfully uploaded.',
    filename: req.file.filename,
  })
})

// --------------------- 2. File Rename Endpoint (POST /api/v1/upload/rename) ---------------------
router.post('/rename', (req: Request, res: Response) => {
  const { originalFilename, newFilename } = req.body

  if (!originalFilename || !newFilename) {
    return res.status(400).json({
      message:
        'Both originalFilename and newFilename are required for renaming.',
    })
  }

  const oldPath = path.resolve(uploadDir, originalFilename)
  const newPath = path.resolve(uploadDir, newFilename)

  if (!fs.existsSync(oldPath)) {
    return res.status(404).json({
      message: `File not found: ${originalFilename}. Upload it first.`,
    })
  }

  try {
    fs.renameSync(oldPath, newPath)

    res.status(200).json({
      message: `File successfully renamed from ${originalFilename} to ${newFilename}.`,
      filename: newFilename,
    })
  } catch (error) {
    console.error('File rename error:', error)
    res.status(500).json({ message: 'Failed to rename file.' })
  }
})

export default router
