import { test } from 'node:test'
import assert from 'node:assert/strict'
import { shuffled, roundSummary } from './flashcards.js'

test('shuffled keeps every card once and does not change the original list', () => {
  const list = [1, 2, 3, 4, 5]
  const result = shuffled(list, () => 0)
  assert.deepEqual([...result].sort(), list)
  assert.deepEqual(list, [1, 2, 3, 4, 5])
  assert.notDeepEqual(result, list)
})

test('roundSummary counts known cards and lists the ones to see again', () => {
  const cards = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
  const summary = roundSummary(cards, { a: 'known', b: 'again', c: 'known' })
  assert.equal(summary.known, 2)
  assert.equal(summary.total, 3)
  assert.deepEqual(summary.again.map((card) => card.id), ['b'])
})
