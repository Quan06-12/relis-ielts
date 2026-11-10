// Serializes network writes; edits made while a request is pending remain queued.
// Different questions from other tabs are preserved because only changed IDs are patched.
export function createAnswerQueue(send) {
  const pending = new Map()
  let flight = null
  async function drain() {
    while (pending.size) {
      const batch = [...pending.values()]
      await send(batch)
      batch.forEach((answer) => {
        if (pending.get(answer.questionId) === answer) pending.delete(answer.questionId)
      })
    }
  }
  function flush() {
    if (!flight)
      flight = drain().finally(() => {
        flight = null
      })
    return flight
  }
  return {
    put(questionId, value) {
      pending.set(questionId, { questionId, value })
    },
    flush,
    get dirty() {
      return pending.size > 0
    },
  }
}
