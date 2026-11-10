import mongoose from 'mongoose'
export async function connectDB(uri) {
  mongoose.set('bufferCommands', false)
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
  console.info('MongoDB connected')
}
