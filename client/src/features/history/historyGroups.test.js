import { test } from 'node:test'
import assert from 'node:assert/strict'
import { startOfWeek, groupByWeek, scoreLabel, modeLabel, whenLabel, historyStats, durationLabel } from './historyGroups.js'

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

test('modeLabel', () => {
  assert.equal(modeLabel({ test: { skill: 'reading' }, mode: { type: 'full' } }), 'Reading · Full test')
  assert.equal(modeLabel({ test: { skill: 'listening' }, mode: { type: 'parts', sectionIndexes: [2] } }), 'Listening · Part 3')
  assert.equal(modeLabel({ test: { skill: 'reading' }, mode: { type: 'parts', sectionIndexes: [0, 1] } }), 'Reading · Passage 1, 2')
})

test('whenLabel: today, yesterday, then the date', () => {
  const now = new Date(2026, 10, 15, 9, 0)
  assert.equal(whenLabel(new Date(2026, 10, 15, 8, 40), now), 'Hôm nay · 08:40')
  assert.equal(whenLabel(new Date(2026, 10, 14, 21, 5), now), 'Hôm qua · 21:05')
  assert.equal(whenLabel(new Date(2026, 9, 26, 22, 10), now), '26/10/2026 · 22:10')
})

test('historyStats: counts, minutes and the mean full-test band per skill', () => {
  const attempts = [
    { test: { skill: 'reading' }, result: { band: 7 } },
    { test: { skill: 'reading' }, result: { band: 6.5 } },
    { test: { skill: 'reading' }, result: { band: null } },
    { test: { skill: 'listening' }, result: { band: 6.5 } },
  ]
  const days = [{ reading: 2, listening: 0, minutes: 50 }, { reading: 1, listening: 1, minutes: 40 }]
  assert.deepEqual(historyStats(attempts, days), {
    count: 4,
    minutes: 90,
    reading: { band: 7, tests: 2 }, // 6.75 → 7.0
    listening: { band: 6.5, tests: 1 },
  })
})

test('durationLabel', () => {
  assert.equal(durationLabel(45), '45 phút')
  assert.equal(durationLabel(229), '3 giờ 49 phút')
  assert.equal(durationLabel(120), '2 giờ')
})
