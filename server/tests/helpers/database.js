import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import '../../src/config/db.js'

// A throwaway MongoDB that lives in memory for the duration of one test file.
// The first run downloads a MongoDB binary (~70 MB), later runs reuse it.
let memoryServer

export async function startTestDatabase() {
  memoryServer = await MongoMemoryServer.create()
  await mongoose.connect(memoryServer.getUri())
}

export async function clearTestDatabase() {
  const collections = Object.values(mongoose.connection.collections)
  await Promise.all(collections.map((collection) => collection.deleteMany({})))
}

export async function stopTestDatabase() {
  await mongoose.disconnect()
  await memoryServer.stop()
}
