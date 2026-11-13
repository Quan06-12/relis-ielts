import { test } from 'node:test'
import assert from 'node:assert/strict'
import { startOfWeek, groupByWeek, scoreLabel } from './historyGroups.js'

// Thursday 13/11/2026, local time
const now = new Date(2026, 10, 13, 10, 0)

test('a week starts on Monday', () => {
  assert.equal(startOfWeek(now).getDate(), 9)
  assert.equal(startOfWeek(new Date(2026, 10, 15, 22, 0)).getDate(), 9) // Sunday still belongs to that week
})

test('attempts are grouped into this week, last week and earlier; empty groups are left out', () => {
  const attempts = [
    { id: 'a', startedAt: new Date(2026, 10, 12) },
    { id: 'b', startedAt: new Date(2026, 10, 3) },
    { id: 'c', startedAt: new Date(2026, 9, 20) },
  ]

  const groups = groupByWeek(attempts, now)

  assert.deepEqual(groups.map((group) => group.label), ['Tuần này', 'Tuần trước', 'Trước đó'])
  assert.deepEqual(groups.map((group) => group.items[0].id), ['a', 'b', 'c'])
  assert.equal(groupByWeek([attempts[0]], now).length, 1)
})

test('score label', () => {
  assert.equal(scoreLabel({ correct: 30, total: 40, band: 7 }), 'Band 7.0')
  assert.equal(scoreLabel({ correct: 9, total: 13, band: null }), '9/13 câu đúng')
  assert.equal(scoreLabel(null), null)
})
