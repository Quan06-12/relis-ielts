import { Router } from 'express'
import multer from 'multer'
import { requireAuth } from '../middleware/requireAuth.js'
import { AppError } from '../errors/AppError.js'
import { uploadFile, UPLOAD_RULES } from '../controllers/uploads.controller.js'

// Keeps the file in memory only long enough to send it to Cloudinary.
const readSingleFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: UPLOAD_RULES.audio.maxBytes, files: 1 },
}).single('file')

// Turns multer's "file too big" error into our FILE_TOO_LARGE error
function receiveFile(request, response, next) {
  readSingleFile(request, response, (error) => {
    if (error?.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError(413, 'FILE_TOO_LARGE', 'File is too large'))
    }
    next(error)
  })
}

export function createUploadRoutes({ saveFile }) {
  const router = Router()
  router.post('/', requireAuth, receiveFile, uploadFile(saveFile))
  return router
}
