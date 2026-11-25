import { test } from 'node:test'
import assert from 'node:assert/strict'
import { pickSuggestions, streakDays, lastWeekTotals } from './homeToday.js'

const tests = [
  { id: 'r-full', skill: 'reading', kind: 'full' },
  { id: 'r1', skill: 'reading', kind: 'single' },
  { id: 'r2', skill: 'reading', kind: 'single' },
  { id: 'l-full', skill: 'listening', kind: 'full' },
  { id: 'l1', skill: 'listening', kind: 'single' },
]

test('suggestions mix both skills and start with short single tests', () => {
  assert.deepEqual(pickSuggestions(tests).map((t) => t.id), ['r1', 'l1', 'r2'])
})

test('suggestions work with fewer tests than asked for', () => {
  assert.deepEqual(pickSuggestions([tests[0]]).map((t) => t.id), ['r-full'])
  assert.deepEqual(pickSuggestions([]), [])
})

test('streakDays lists the last days oldest first and marks the active ones', () => {
  const today = new Date('2026-11-25T10:00:00')
  const days = streakDays([{ date: '2026-11-23', reading: 1, listening: 0 }, { date: '2026-11-25', reading: 0, listening: 2 }], today, 4)
  assert.deepEqual(days.map((d) => d.key), ['2026-11-22', '2026-11-23', '2026-11-24', '2026-11-25'])
  assert.deepEqual(days.map((d) => d.active), [false, true, false, true])
  assert.equal(days[3].isToday, true)
  assert.equal(days[3].weekday, 'T4')
})

test('lastWeekTotals adds submissions and minutes of the last 7 days only', () => {
  const today = new Date('2026-11-25T10:00:00')
  const totals = lastWeekTotals(
    [
      { date: '2026-11-25', reading: 1, listening: 1, minutes: 30 },
      { date: '2026-11-19', reading: 1, listening: 0, minutes: 20 },
      { date: '2026-11-18', reading: 5, listening: 0, minutes: 99 },
    ],
    today
  )
  assert.deepEqual(totals, { submissions: 3, minutes: 50 })
})
