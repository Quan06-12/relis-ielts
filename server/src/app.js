import express from 'express'
import cors from 'cors'
import { requireAuth } from './middleware/requireAuth.js'
import { errorHandler } from './middleware/errorHandler.js'
import { notFound } from './utils/errors.js'
import { createAttemptService } from './services/attempts.js'
import { createVocabularyService } from './services/vocabulary.js'

export function createApp({ repo, config, access, now, mountAuth }) {
  const app = express()
  app.disable('x-powered-by')
  app.use(cors({ origin: config.clientUrl }))
  app.use(express.json({ limit: '1mb' }))
  app.get('/api/health', (_req, res) => res.json({ ok: true }))
  // A can mount /auth/google and /auth/me here; production has no fake identity routes.
  if (mountAuth) mountAuth(app)
  app.use('/api', requireAuth(config.jwtSecret))
  const attempts = createAttemptService(repo, { access, now })
  const vocab = createVocabularyService(repo)
  app.get('/api/tests/:testId/play', async (req, res) =>
    res.json(await attempts.play(req.params.testId, req.userId)),
  )
  app.post('/api/attempts', async (req, res) =>
    res.status(201).json(await attempts.start(req.userId, req.body)),
  )
  app.get('/api/attempts', async (req, res) => res.json(await attempts.list(req.userId, req.query)))
  app.get('/api/attempts/:attemptId', async (req, res) =>
    res.json(await attempts.get(req.params.attemptId, req.userId)),
  )
  app.patch('/api/attempts/:attemptId/answers', async (req, res) =>
    res.json(await attempts.save(req.params.attemptId, req.userId, req.body?.answers)),
  )
  app.post('/api/attempts/:attemptId/submit', async (req, res) =>
    res.json(await attempts.submit(req.params.attemptId, req.userId)),
  )
  app.get('/api/attempts/:attemptId/review', async (req, res) =>
    res.json(await attempts.review(req.params.attemptId, req.userId)),
  )
  app.get('/api/dashboard', async (req, res) => res.json(await attempts.dashboard(req.userId)))
  app.get('/api/vocab-sets', async (req, res) => res.json(await vocab.list(req.userId)))
  app.post('/api/vocab-sets', async (req, res) =>
    res.status(201).json(await vocab.save(req.userId, req.body)),
  )
  app.get('/api/vocab-sets/:setId', async (req, res) =>
    res.json(await vocab.get(req.params.setId, req.userId)),
  )
  app.put('/api/vocab-sets/:setId', async (req, res) =>
    res.json(await vocab.save(req.userId, req.body, req.params.setId)),
  )
  app.delete('/api/vocab-sets/:setId', async (req, res) => {
    await vocab.delete(req.params.setId, req.userId)
    res.sendStatus(204)
  })
  app.use((_req, _res, next) => next(notFound()))
  app.use(errorHandler)
  return app
}
