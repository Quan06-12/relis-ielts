// Only imported by dev entrypoint and tests. Never used by src/server.js.
export function createMemoryRepository(tests = []) {
  const attempts = new Map(),
    vocab = new Map()
  const clone = (value) => (value ? structuredClone(value) : null)
  return {
    async getTest(id) {
      return clone(tests.find((t) => t.id === id))
    },
    async getAttempt(id) {
      return clone(attempts.get(id))
    },
    async activeAttempt(userId, testId) {
      return clone(
        [...attempts.values()].find(
          (a) => a.userId === userId && a.testId === testId && a.status === 'in_progress',
        ),
      )
    },
    async createAttempt(doc) {
      if (
        [...attempts.values()].some(
          (a) => a.userId === doc.userId && a.testId === doc.testId && a.status === 'in_progress',
        )
      )
        return null
      attempts.set(doc.id, clone(doc))
      return clone(doc)
    },
    async compareAndSet(doc, revision) {
      if (attempts.get(doc.id)?.revision !== revision) return null
      const next = { ...clone(doc), revision: revision + 1 }
      attempts.set(doc.id, next)
      return clone(next)
    },
    async listAttempts(userId) {
      return clone(
        [...attempts.values()]
          .filter((a) => a.userId === userId)
          .sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt)),
      )
    },
    async listVocab(userId) {
      return clone([...vocab.values()].filter((s) => s.userId === userId))
    },
    async getVocab(id, userId) {
      const s = vocab.get(id)
      return s?.userId === userId ? clone(s) : null
    },
    async putVocab(doc, create) {
      if (!create && vocab.get(doc.id)?.userId !== doc.userId) return null
      vocab.set(doc.id, clone(doc))
      return clone(doc)
    },
    async deleteVocab(id, userId) {
      if (vocab.get(id)?.userId !== userId) return false
      return vocab.delete(id)
    },
  }
}
