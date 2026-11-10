import mongoose from 'mongoose'

// API convention (docs/api/README.md): send `id` instead of `_id`, and never send `__v`.
// Setting it once here applies to every model and every nested document.
mongoose.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (document, json) => {
    delete json._id
    return json
  },
})

export async function connectDatabase(uri) {
  await mongoose.connect(uri)
  console.log('MongoDB connected')
}
