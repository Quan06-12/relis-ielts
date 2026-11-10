import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createAnswerQueue } from '../src/practice/answerQueue.js'
import { historyGroup, clockText } from '../src/practice/history.js'

test('edits during autosave are sent in order and newest value is retained', async () => {
  const batches = []
  let release
  const queue = createAnswerQueue(async (batch) => {
    batches.push(batch)
    if (batches.length === 1)
      await new Promise((resolve) => {
        release = resolve
      })
  })
  queue.put('q1', ['old'])
  const saving = queue.flush()
  queue.put('q1', ['new'])
  queue.put('q2', ['second'])
  const concurrent = queue.flush()
  release()
  await Promise.all([saving, concurrent])
  assert.equal(batches.length, 2)
  assert.deepEqual(batches[1], [
    { questionId: 'q1', value: ['new'] },
    { questionId: 'q2', value: ['second'] },
  ])
  assert.equal(queue.dirty, false)
})
test('failed saves retain pending answers for explicit retry before submit', async () => {
  let fail = true
  const queue = createAnswerQueue(async () => {
    if (fail) throw new Error('offline')
  })
  queue.put('q1', [])
  await assert.rejects(queue.flush(), /offline/)
  assert.equal(queue.dirty, true)
  fail = false
  await queue.flush()
  assert.equal(queue.dirty, false)
})
test('history week boundaries use Vietnam time; timer never negative', () => {
  const now = new Date('2026-11-09T00:01:00+07:00')
  assert.equal(historyGroup('2026-11-08T17:00:00Z', now), 'Tuần này')
  assert.equal(historyGroup('2026-11-08T16:59:59Z', now), 'Tuần trước')
  assert.equal(historyGroup('2026-10-31T12:00:00Z', now), 'Trước đó')
  assert.equal(clockText(-10), '00:00')
  assert.equal(clockText(61), '01:01')
})
