import mongoose from 'mongoose'
const schema = new mongoose.Schema(
  {
    _id: String,
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    words: [{ _id: false, term: String, meaning: String, example: String }],
    updatedAt: { type: Date, required: true },
  },
  { versionKey: false },
)
export const VocabSet = mongoose.model('VocabSet', schema)
