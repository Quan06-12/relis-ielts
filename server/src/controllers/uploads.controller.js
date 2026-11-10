import { AppError, validationError } from '../errors/AppError.js'

// Which files each kind accepts (US12 cover image, US14 audio)
export const UPLOAD_RULES = {
  image: { maxBytes: 2 * 1024 * 1024, types: ['image/jpeg', 'image/png', 'image/webp'] },
  audio: { maxBytes: 30 * 1024 * 1024, types: ['audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/aac'] },
}

// POST /api/uploads — multipart form with `file` and `kind` (image | audio)
// `saveFile` is passed in so tests can use a fake storage instead of Cloudinary.
export function uploadFile(saveFile) {
  return async (request, response) => {
    const kind = request.body?.kind
    const rule = UPLOAD_RULES[kind]
    const file = request.file

    if (!rule) throw validationError([{ field: 'kind', message: 'kind must be image or audio' }])
    if (!file) throw validationError([{ field: 'file', message: 'file is required' }])
    if (!rule.types.includes(file.mimetype)) {
      throw validationError([{ field: 'file', message: `${kind} must be one of: ${rule.types.join(', ')}` }])
    }
    // multer already stops anything above the audio limit; images have a smaller one
    if (file.size > rule.maxBytes) {
      throw new AppError(413, 'FILE_TOO_LARGE', `${kind} must be at most ${rule.maxBytes / 1024 / 1024} MB`)
    }

    const saved = await saveFile(file, kind)
    response.status(201).json(saved)
  }
}
