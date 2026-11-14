// Checking and shaping vocabulary sets and words (US47, US48). Pure, unit tested.
import { VOCAB_COLORS, WORD_TYPES } from '../models/VocabSet.js'

const text = (value) => (typeof value === 'string' ? value.trim() : '')

// Fields of a set from a request body; errors is a list for VALIDATION_ERROR details.
// partial = true for PATCH: only the fields that are present are checked and returned.
export function readSetFields(body = {}, { partial = false } = {}) {
  const fields = {}
  const errors = []
  if (!partial || body.name !== undefined) {
    fields.name = text(body.name)
    if (fields.name === '') errors.push({ field: 'name', message: 'name is required' })
    else if (fields.name.length > 80) errors.push({ field: 'name', message: 'name is at most 80 characters' })
  }
  if (body.color !== undefined) {
    if (VOCAB_COLORS.includes(body.color)) fields.color = body.color
    else errors.push({ field: 'color', message: `color must be one of ${VOCAB_COLORS.join(', ')}` })
  }
  if (body.coverUrl !== undefined) {
    fields.coverUrl = body.coverUrl === null || text(body.coverUrl) === '' ? null : text(body.coverUrl)
  }
  return { fields, errors }
}

// Fields of a word from a request body. Term and meaning are required; verb forms only stay for verbs.
export function readWordFields(body = {}) {
  const type = WORD_TYPES.includes(body.type) ? body.type : 'other'
  const fields = {
    type,
    term: text(body.term),
    meaning: text(body.meaning),
    note: text(body.note),
    verbForms: type === 'v' ? text(body.verbForms) : '',
    collocations: text(body.collocations),
    example: text(body.example),
  }
  const errors = []
  if (fields.term === '') errors.push({ field: 'term', message: 'term is required' })
  if (fields.meaning === '') errors.push({ field: 'meaning', message: 'meaning is required' })
  return { fields, errors }
}

// True when another word of the set already has this term (ignoring case and extra spaces)
export function isDuplicateTerm(words, term, exceptWordId = null) {
  const key = (value) => value.trim().replace(/\s+/g, ' ').toLowerCase()
  return words.some((word) => key(word.term) === key(term) && String(word._id ?? word.id) !== String(exceptWordId))
}

export function toWordView(word) {
  return {
    id: String(word._id),
    type: word.type,
    term: word.term,
    meaning: word.meaning,
    note: word.note,
    verbForms: word.verbForms,
    collocations: word.collocations,
    example: word.example,
  }
}

// A set as a card in the list: the first few words as a preview and the count
export function toSetSummary(set) {
  return {
    id: String(set._id),
    name: set.name,
    color: set.color,
    coverUrl: set.coverUrl,
    wordCount: set.words.length,
    preview: set.words.slice(0, 4).map((word) => word.term),
    updatedAt: set.updatedAt,
  }
}

// A set with all its words, newest first
export function toSetView(set) {
  return { ...toSetSummary(set), words: [...set.words].reverse().map(toWordView) }
}
