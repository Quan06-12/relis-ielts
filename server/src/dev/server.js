import 'dotenv/config'
import jwt from 'jsonwebtoken'
import { createApp } from '../app.js'
import { createMemoryRepository } from './memoryRepository.js'
import { fixtureTests, DEV_USER } from './fixtures.js'
import { requireAuth } from '../middleware/requireAuth.js'

if (process.env.NODE_ENV === 'production') throw new Error('Dev server is forbidden in production')
const secret = 'local-fixture-only-not-a-production-secret'
const config = { jwtSecret: secret, clientUrl: 'http://localhost:5173' }
const tests = fixtureTests()
const user = { id: DEV_USER, name: 'Học viên demo', email: 'learner@example.test', avatarUrl: null }
const app = createApp({
  repo: createMemoryRepository(tests),
  config,
  mountAuth(app) {
    // Explicit loopback-only server; these are fixtures, not A's Google authentication implementation.
    app.post('/api/dev/session', (_req, res) =>
      res.json({ token: jwt.sign({ userId: DEV_USER }, secret, { expiresIn: '2h' }), user }),
    )
    app.get('/api/auth/me', requireAuth(secret), (_req, res) => res.json({ user }))
    app.get('/api/tests', requireAuth(secret), (_req, res) =>
      res.json({
        items: tests.map(({ id, title, skill, kind, status, durationMin, questionCount }) => ({
          id,
          title,
          skill,
          kind,
          status,
          durationMin,
          questionCount,
        })),
        total: tests.length,
        page: 1,
        limit: 20,
      }),
    )
    app.get('/dev/audio.wav', (_req, res) => {
      // Locally generated tone to verify playback without external or copyrighted audio.
      const rate = 8000,
        samples = rate * 3,
        wav = Buffer.alloc(44 + samples * 2)
      wav.write('RIFF')
      wav.writeUInt32LE(wav.length - 8, 4)
      wav.write('WAVEfmt ', 8)
      wav.writeUInt32LE(16, 16)
      wav.writeUInt16LE(1, 20)
      wav.writeUInt16LE(1, 22)
      wav.writeUInt32LE(rate, 24)
      wav.writeUInt32LE(rate * 2, 28)
      wav.writeUInt16LE(2, 32)
      wav.writeUInt16LE(16, 34)
      wav.write('data', 36)
      wav.writeUInt32LE(samples * 2, 40)
      for (let i = 0; i < samples; i++)
        wav.writeInt16LE(Math.round(Math.sin((i * Math.PI * 880) / rate) * 2000), 44 + i * 2)
      res.type('audio/wav').send(wav)
    })
  },
})
app.listen(5000, '127.0.0.1', () =>
  console.info(
    'Dev fixtures: http://localhost:5000 (memory resets on restart; audio is a test tone)',
  ),
)
