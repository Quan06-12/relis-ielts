import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { connectDB } from '../src/config/db.js'
import { createMongoRepository, ensureIndexes } from '../src/repositories/mongo.js'
import { createApp } from '../src/app.js'
import { fixtureTests, DEV_USER } from '../src/dev/fixtures.js'

test(
  'Mongo persistence, atomic duplicate submit, deadline and ownership',
  { timeout: 120000 },
  async () => {
    process.env.MONGOMS_DOWNLOAD_TIMEOUT = '15000'
    process.env.MONGOMS_MAX_RETRIES = '1'
    const mongo = await MongoMemoryServer.create({
      binary: { downloadDir: fileURLToPath(new URL('../.cache/mongodb/', import.meta.url)) },
      instance: { ip: '127.0.0.1' },
    })
    try {
      await connectDB(mongo.getUri())
      await ensureIndexes()
      const tests = fixtureTests()
      await mongoose.connection
        .collection('tests')
        .insertMany(
          tests.map(({ id, ownerId, ...test }) => ({
            ...test,
            _id: new mongoose.Types.ObjectId(id),
            ownerId: new mongoose.Types.ObjectId(ownerId),
          })),
        )
      const config = {
        jwtSecret: 'test-only-long-secret-for-mongo-integration',
        clientUrl: 'http://localhost:5173',
      }
      let app = createApp({ repo: createMongoRepository(), config })
      const token = jwt.sign({ userId: DEV_USER }, config.jwtSecret)
      const call = (method, path, body) =>
        request(app)[method](`/api${path}`).set('Authorization', `Bearer ${token}`).send(body)
      const input = {
        testId: tests[0].id,
        mode: { type: 'full', sectionIndexes: [0, 1, 2], timeLimitMin: 1 },
      }
      const starts = await Promise.all([
        call('post', '/attempts', input),
        call('post', '/attempts', input),
      ])
      assert.deepEqual(starts.map((r) => r.status).sort(), [201, 409])
      const id = starts.find((r) => r.status === 201).body.attempt.id
      const questions = tests[0].sections[0].groups.slice(0, 2).map((g) => g.questions[0])
      const saves = await Promise.all(
        questions.map((q) =>
          call('patch', `/attempts/${id}/answers`, {
            answers: [{ questionId: q.id, value: [q.answers[0]] }],
          }),
        ),
      )
      assert.ok(saves.every((r) => r.status === 200))
      // Recreate the app/repository to prove answers came from Mongo, not process memory.
      app = createApp({ repo: createMongoRepository(), config })
      assert.equal((await call('get', `/attempts/${id}`)).body.attempt.answers.length, 2)
      const submits = await Promise.all([
        call('post', `/attempts/${id}/submit`),
        call('post', `/attempts/${id}/submit`),
      ])
      assert.deepEqual(submits[0].body, submits[1].body)
      assert.equal(submits[0].body.result.correct, 2)
      const next = (await call('post', '/attempts', input)).body.attempt.id
      await mongoose.connection
        .collection('attempts')
        .updateOne({ _id: next }, { $set: { expiresAt: new Date(Date.now() - 1000) } })
      assert.equal((await call('patch', `/attempts/${next}/answers`, { answers: [] })).status, 409)
      assert.equal((await call('get', `/attempts/${next}`)).body.attempt.status, 'submitted')
      const vocab = (await call('post', '/vocab-sets', { title: 'Local words', words: [] })).body
        .set
      assert.equal((await call('get', `/vocab-sets/${vocab.id}`)).body.set.title, 'Local words')
    } finally {
      await mongoose.disconnect()
      await mongo.stop()
    }
  },
)
