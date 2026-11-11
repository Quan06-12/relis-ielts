import express from 'express'
import cors from 'cors'
import healthRoutes from './routes/health.routes.js'
import { createAuthRoutes } from './routes/auth.routes.js'
import testsRoutes from './routes/tests.routes.js'
import attemptsRoutes from './routes/attempts.routes.js'
import { createGoogleVerifier } from './services/googleAuth.js'
import { createUploadRoutes } from './routes/uploads.routes.js'
import { createCloudinaryStorage } from './services/fileStorage.js'
import { notFoundRoute } from './middleware/notFoundRoute.js'
import { errorHandler } from './middleware/errorHandler.js'

// Builds the Express app without starting it, so tests can call it directly.
// Tests pass fakes for the outside services (Google, Cloudinary); the defaults are the real ones.
export function createApp({
  clientUrl = 'http://localhost:5173',
  verifyGoogleCredential = createGoogleVerifier(process.env.GOOGLE_CLIENT_ID),
  saveFile = createCloudinaryStorage(),
} = {}) {
  const app = express()

  // Only our own frontend may call the API from a browser
  app.use(cors({ origin: clientUrl }))
  app.use(express.json({ limit: '1mb' }))

  app.use('/api/health', healthRoutes)
  app.use('/api/auth', createAuthRoutes({ verifyGoogleCredential }))
  app.use('/api/tests', testsRoutes)
  app.use('/api/uploads', createUploadRoutes({ saveFile }))
  app.use('/api/attempts', attemptsRoutes)

  app.use(notFoundRoute)
  app.use(errorHandler)

  return app
}
