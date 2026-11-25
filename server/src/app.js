import express from 'express'
import cors from 'cors'
import healthRoutes from './routes/health.routes.js'
import docsRoutes from './routes/docs.routes.js'
import { createAuthRoutes } from './routes/auth.routes.js'
import testsRoutes from './routes/tests.routes.js'
import attemptsRoutes from './routes/attempts.routes.js'
import classesRoutes from './routes/classes.routes.js'
import usersRoutes from './routes/users.routes.js'
import vocabRoutes from './routes/vocab.routes.js'
import adminRoutes from './routes/admin.routes.js'
import { createGoogleVerifier } from './services/googleAuth.js'
import { createUploadRoutes } from './routes/uploads.routes.js'
import { createCloudinaryStorage } from './services/fileStorage.js'
import { createFeedbackRoutes } from './routes/feedback.routes.js'
import { createGeminiFeedback } from './services/aiFeedback.js'
import { notFoundRoute } from './middleware/notFoundRoute.js'
import { errorHandler } from './middleware/errorHandler.js'

// Builds the Express app without starting it, so tests can call it directly.
// Tests pass fakes for the outside services (Google, Cloudinary, Gemini); the defaults are the real ones.
export function createApp({
  clientUrl = 'http://localhost:5173',
  verifyGoogleCredential = createGoogleVerifier(process.env.GOOGLE_CLIENT_ID),
  saveFile = createCloudinaryStorage(),
  generateFeedback = createGeminiFeedback(),
} = {}) {
  const app = express()
  // Render sits in front of the app as a proxy; trust it so request.ip is the visitor's address
  app.set('trust proxy', 1)

  // Only our own frontend may call the API from a browser
  app.use(cors({ origin: clientUrl }))
  app.use(express.json({ limit: '1mb' }))

  app.use('/api/health', healthRoutes)
  app.use('/api/docs', docsRoutes)
  app.use('/api/auth', createAuthRoutes({ verifyGoogleCredential }))
  app.use('/api/tests', testsRoutes)
  app.use('/api/uploads', createUploadRoutes({ saveFile }))
  app.use('/api/attempts', createFeedbackRoutes({ generateFeedback }))
  app.use('/api/attempts', attemptsRoutes)
  app.use('/api/classes', classesRoutes)
  app.use('/api/users', usersRoutes)
  app.use('/api/vocab-sets', vocabRoutes)
  app.use('/api/admin', adminRoutes)

  app.use(notFoundRoute)
  app.use(errorHandler)

  return app
}
