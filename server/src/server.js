import 'dotenv/config'
import mongoose from 'mongoose'
import { readConfig } from './config/env.js'
import { connectDB } from './config/db.js'
import { createMongoRepository, ensureIndexes } from './repositories/mongo.js'
import { createApp } from './app.js'

try {
  const config = readConfig()
  await connectDB(config.mongoUri)
  await ensureIndexes()
  const server = createApp({ repo: createMongoRepository(), config }).listen(config.port, () =>
    console.info(`Relis API listening on ${config.port}`),
  )
  const stop = () =>
    server.close(async () => {
      await mongoose.disconnect()
      process.exit(0)
    })
  process.on('SIGTERM', stop)
  process.on('SIGINT', stop)
} catch (err) {
  console.error(`Startup failed: ${err.name}. Check local configuration and MongoDB availability.`)
  process.exitCode = 1
}
