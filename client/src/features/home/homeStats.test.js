import { test } from 'node:test'
import assert from 'node:assert/strict'
import { daysUntil, latestBands, gapLabel, BAND_CHOICES } from './homeStats.js'

test('days until the exam', () => {
  const now = new Date(2026, 10, 14, 22, 0)
  assert.equal(daysUntil(new Date(2026, 10, 20), now), 6)
  assert.equal(daysUntil(new Date(2026, 10, 14, 8, 0), now), 0)
  assert.equal(daysUntil(null, now), null)
})

test('latest band per skill takes the newest full test only', () => {
  const attempts = [
    { test: { skill: 'reading' }, result: { band: null } }, // parts practice, ignored
    { test: { skill: 'reading' }, result: { band: 6.5 } },
    { test: { skill: 'reading' }, result: { band: 5.5 } },
    { test: { skill: 'listening' }, result: null }, // still in progress
  ]

  assert.deepEqual(latestBands(attempts), { reading: 6.5, listening: null })
})

test('gap to the goal', () => {
  assert.equal(gapLabel(6, 7), 'còn 1.0')
  assert.equal(gapLabel(7.5, 7), 'đạt mục tiêu')
  assert.equal(gapLabel(null, 7), null)
  assert.equal(gapLabel(6, null), null)
})

test('band choices go from 4.0 to 9.0 in steps of 0.5', () => {
  assert.equal(BAND_CHOICES[0], 4)
  assert.equal(BAND_CHOICES.at(-1), 9)
  assert.equal(BAND_CHOICES.length, 11)
})
