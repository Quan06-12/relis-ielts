import express from 'express'
import cors from 'cors'
import healthRoutes from './routes/health.routes.js'
import { notFoundRoute } from './middleware/notFoundRoute.js'
import { errorHandler } from './middleware/errorHandler.js'

// Builds the Express app without starting it, so tests can call it directly.
export function createApp({ clientUrl = 'http://localhost:5173' } = {}) {
  const app = express()

  // Only our own frontend may call the API from a browser
  app.use(cors({ origin: clientUrl }))
  app.use(express.json({ limit: '1mb' }))

  app.use('/api/health', healthRoutes)
  // Each feature mounts its routes here, e.g. app.use('/api/auth', authRoutes)

  app.use(notFoundRoute)
  app.use(errorHandler)

  return app
}
