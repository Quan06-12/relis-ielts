import mongoose from 'mongoose'

// Same 5 colours as classes, used when the set has no cover image (US47)
export const VOCAB_COLORS = ['purple', 'blue', 'green', 'orange', 'pink']
export const WORD_TYPES = ['n', 'v', 'adj', 'adv', 'phr', 'other']

// One word of a set (US48). verbForms is only kept for verbs ("go – went – gone").
const wordSchema = new mongoose.Schema(
  {
    type: { type: String, enum: WORD_TYPES, default: 'other' },
    term: { type: String, required: true, trim: true, maxlength: 80 },
    meaning: { type: String, required: true, trim: true, maxlength: 200 },
    note: { type: String, default: '', trim: true, maxlength: 500 },
    verbForms: { type: String, default: '', trim: true, maxlength: 120 },
    collocations: { type: String, default: '', trim: true, maxlength: 300 },
    example: { type: String, default: '', trim: true, maxlength: 500 },
  },
  { timestamps: true },
)

// A personal vocabulary set by topic (collection "vocabsets"). The words live inside the set:
// a set holds at most a few hundred words and is always read together with them.
const vocabSetSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    color: { type: String, enum: VOCAB_COLORS, default: 'purple' },
    coverUrl: { type: String, default: null },
    words: { type: [wordSchema], default: [] },
  },
  { timestamps: true },
)

export const VocabSet = mongoose.model('VocabSet', vocabSetSchema)
