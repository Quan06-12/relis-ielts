import { v2 as cloudinary } from 'cloudinary'

// Saves uploaded files on Cloudinary and returns their public URL.
// Render deletes its own disk on every deploy, so files cannot live on the server.
// The connection comes from CLOUDINARY_URL (cloudinary://<key>:<secret>@<cloud-name>).
export function createCloudinaryStorage() {
  return function saveFile(file, kind) {
    return new Promise((resolve, reject) => {
      const options = {
        folder: `relis/${kind}`,
        // Cloudinary files audio under "video"; it also tells us the audio length
        resource_type: kind === 'audio' ? 'video' : 'image',
      }
      const upload = cloudinary.uploader.upload_stream(options, (error, result) => {
        if (error) return reject(error)
        resolve({ url: result.secure_url, durationSec: result.duration ?? null })
      })
      upload.end(file.buffer)
    })
  }
}
