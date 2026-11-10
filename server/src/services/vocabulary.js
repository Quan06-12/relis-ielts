import { randomBytes } from 'node:crypto'
import { checkId, invalid, notFound } from '../utils/errors.js'
function validate(input) {
  const text = (value, max, required = true) =>
    typeof value === 'string' && value.length <= max && (!required || value.trim().length > 0)
  if (
    !input ||
    !text(input.title, 120) ||
    !Array.isArray(input.words) ||
    input.words.length > 500 ||
    input.words.some(
      (w) => !w || !text(w.term, 200) || !text(w.meaning, 1000) || !text(w.example, 2000, false),
    )
  )
    throw invalid('vocabulary')
  return {
    title: input.title.trim(),
    words: input.words.map(({ term, meaning, example }) => ({
      term: term.trim(),
      meaning: meaning.trim(),
      example: example.trim(),
    })),
  }
}
const view = ({ id, title, words, updatedAt }) => ({ id, title, words, updatedAt })
export function createVocabularyService(repo) {
  async function get(id, userId) {
    const set = await repo.getVocab(checkId(id), userId)
    if (!set) throw notFound()
    return set
  }
  return {
    async list(userId) {
      return { items: (await repo.listVocab(userId)).map(view) }
    },
    async get(id, userId) {
      return { set: view(await get(id, userId)) }
    },
    async save(userId, input, id) {
      const data = validate(input)
      if (id) await get(id, userId)
      const set = await repo.putVocab(
        {
          ...data,
          id: id || randomBytes(12).toString('hex'),
          userId,
          updatedAt: new Date().toISOString(),
        },
        !id,
      )
      if (!set) throw notFound()
      return { set: view(set) }
    },
    async delete(id, userId) {
      if (!(await repo.deleteVocab(checkId(id), userId))) throw notFound()
    },
  }
}
