import { loadConfig } from './config/env.js'
import { connectDatabase } from './config/db.js'
import { createApp } from './app.js'
import { User } from './models/User.js'

// Entry point: read settings, connect to MongoDB, then start listening.
const config = loadConfig()

await connectDatabase(config.mongodbUri)
// googleId and email became sparse when guests were added; rebuild indexes that changed
await User.syncIndexes()

const app = createApp(config)

app.listen(config.port, () => {
  console.log(`API running on http://localhost:${config.port}/api`)
})
