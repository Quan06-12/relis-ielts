import mongoose from 'mongoose'
import { VocabSet } from '../models/VocabSet.js'
import { AppError, notFound, validationError } from '../errors/AppError.js'
import { readSetFields, readWordFields, isDuplicateTerm, toSetSummary, toSetView, toWordView } from '../utils/vocab.js'

// Vocabulary sets are personal: every route only finds sets owned by the signed-in user,
// so someone else's set is a 404 (US47, US48).

async function findMySet(request) {
  const { setId } = request.params
  if (!mongoose.isValidObjectId(setId)) throw notFound('Vocabulary set')
  const set = await VocabSet.findOne({ _id: setId, ownerId: request.userId })
  if (!set) throw notFound('Vocabulary set')
  return set
}

const duplicateWord = (term) => new AppError(409, 'DUPLICATE_WORD', `"${term}" is already in this set`, [{ field: 'term', message: 'already in this set' }])

// GET /api/vocab-sets — my sets as cards, most recently changed first
export async function listMySets(request, response) {
  const sets = await VocabSet.find({ ownerId: request.userId }).sort({ updatedAt: -1 })
  response.json({ items: sets.map(toSetSummary) })
}

// POST /api/vocab-sets — only the name is required (US47)
export async function createSet(request, response) {
  const { fields, errors } = readSetFields(request.body)
  if (errors.length) throw validationError(errors)
  const set = await VocabSet.create({ ...fields, ownerId: request.userId })
  response.status(201).json({ set: toSetView(set) })
}

// GET /api/vocab-sets/:setId — the set with all its words
export async function getSet(request, response) {
  response.json({ set: toSetView(await findMySet(request)) })
}

// PATCH /api/vocab-sets/:setId — rename, change colour or cover
export async function updateSet(request, response) {
  const set = await findMySet(request)
  const { fields, errors } = readSetFields(request.body, { partial: true })
  if (errors.length) throw validationError(errors)
  set.set(fields)
  await set.save()
  response.json({ set: toSetView(set) })
}

// DELETE /api/vocab-sets/:setId — the set and its words
export async function deleteSet(request, response) {
  const set = await findMySet(request)
  await set.deleteOne()
  response.status(204).end()
}

// POST /api/vocab-sets/:setId/words — 409 DUPLICATE_WORD when the term is already in the set (US48)
export async function addWord(request, response) {
  const set = await findMySet(request)
  const { fields, errors } = readWordFields(request.body)
  if (errors.length) throw validationError(errors)
  if (isDuplicateTerm(set.words, fields.term)) throw duplicateWord(fields.term)

  set.words.push(fields)
  await set.save()
  response.status(201).json({ word: toWordView(set.words.at(-1)) })
}

// PUT /api/vocab-sets/:setId/words/:wordId — replace every field of the word
export async function updateWord(request, response) {
  const set = await findMySet(request)
  const word = mongoose.isValidObjectId(request.params.wordId) ? set.words.id(request.params.wordId) : null
  if (!word) throw notFound('Word')

  const { fields, errors } = readWordFields(request.body)
  if (errors.length) throw validationError(errors)
  if (isDuplicateTerm(set.words, fields.term, word._id)) throw duplicateWord(fields.term)

  word.set(fields)
  await set.save()
  response.json({ word: toWordView(word) })
}

// DELETE /api/vocab-sets/:setId/words/:wordId
export async function deleteWord(request, response) {
  const set = await findMySet(request)
  const word = mongoose.isValidObjectId(request.params.wordId) ? set.words.id(request.params.wordId) : null
  if (!word) throw notFound('Word')

  word.deleteOne()
  await set.save()
  response.status(204).end()
}
