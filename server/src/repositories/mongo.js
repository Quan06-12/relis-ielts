import mongoose from 'mongoose'
import { Attempt } from '../models/Attempt.js'
import { VocabSet } from '../models/VocabSet.js'

function plain(value) {
  if (value instanceof Date) return value.toISOString()
  if (value instanceof mongoose.Types.ObjectId) return value.toString()
  if (Array.isArray(value)) return value.map(plain)
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .filter(([k]) => k !== '__v')
        .map(([k, v]) => [k === '_id' ? 'id' : k, plain(v)]),
    )
  return value
}
export function createMongoRepository() {
  return {
    // Read-only adapter to A's Test collection; no ownership of A's editor schema or CRUD.
    async getTest(id) {
      return plain(
        await mongoose.connection
          .collection('tests')
          .findOne({ _id: new mongoose.Types.ObjectId(id) }),
      )
    },
    async getAttempt(id) {
      return plain(await Attempt.findById(id).lean())
    },
    async activeAttempt(userId, testId) {
      return plain(await Attempt.findOne({ userId, testId, status: 'in_progress' }).lean())
    },
    async createAttempt(doc) {
      const { id, ...fields } = doc
      try {
        return plain((await Attempt.create({ _id: id, ...fields })).toObject())
      } catch (err) {
        if (err.code === 11000) return null
        throw err
      }
    },
    async compareAndSet(doc, revision, liveOnly = false) {
      const { id, ...fields } = doc
      const filter = { _id: id, revision }
      // Mongo's own clock also enforces expiry for writes delayed in the database queue.
      if (liveOnly)
        Object.assign(filter, { status: 'in_progress', $expr: { $gt: ['$expiresAt', '$$NOW'] } })
      return plain(
        await Attempt.findOneAndUpdate(
          filter,
          { $set: { ...fields, revision: revision + 1 } },
          { returnDocument: 'after', runValidators: true },
        ).lean(),
      )
    },
    async listAttempts(userId) {
      return plain(await Attempt.find({ userId }).sort({ startedAt: -1 }).lean())
    },
    async listVocab(userId) {
      return plain(await VocabSet.find({ userId }).sort({ updatedAt: -1 }).lean())
    },
    async getVocab(id, userId) {
      return plain(await VocabSet.findOne({ _id: id, userId }).lean())
    },
    async putVocab(doc, create = false) {
      const { id, ...fields } = doc
      if (create) return plain((await VocabSet.create({ _id: id, ...fields })).toObject())
      return plain(
        await VocabSet.findOneAndUpdate(
          { _id: id, userId: fields.userId },
          { $set: fields },
          { returnDocument: 'after', runValidators: true },
        ).lean(),
      )
    },
    async deleteVocab(id, userId) {
      return (await VocabSet.deleteOne({ _id: id, userId })).deletedCount > 0
    },
  }
}
export async function ensureIndexes() {
  await Promise.all([Attempt.init(), VocabSet.init()])
}
