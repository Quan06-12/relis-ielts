import { test } from 'node:test'
import assert from 'node:assert/strict'
import { toKey, weekOf, monthGrid, formatMinutes, timeLevel, activeDaysInMonth, weekRows, displayDate } from './activityCalendar.js'

test('weekOf starts on Monday and ends on Sunday', () => {
  const week = weekOf('2026-11-14') // a Saturday
  assert.equal(week[0], '2026-11-09')
  assert.equal(week[6], '2026-11-15')
  assert.equal(weekOf('2026-11-16')[0], '2026-11-16') // a Monday is its own week start
})

test('monthGrid: October 2026 starts on a Thursday and needs 5 weeks', () => {
  const weeks = monthGrid(2026, 9)
  assert.equal(weeks.length, 5)
  assert.deepEqual(weeks[0][0], { key: '2026-09-28', day: 28, inMonth: false })
  assert.deepEqual(weeks[0][3], { key: '2026-10-01', day: 1, inMonth: true })
  assert.equal(weeks.at(-1).at(-1).key, '2026-11-01')
})

test('formatMinutes and timeLevel', () => {
  assert.equal(formatMinutes(33), '33m')
  assert.equal(formatMinutes(65), '1h05m')
  assert.deepEqual([0, 10, 45, 90].map(timeLevel), [0, 1, 2, 3])
})

test('activeDaysInMonth only counts the given month', () => {
  const days = [
    { date: '2026-10-31', reading: 1, listening: 0, minutes: 20 },
    { date: '2026-11-02', reading: 0, listening: 2, minutes: 40 },
    { date: '2026-11-14', reading: 1, listening: 0, minutes: 30 },
  ]
  assert.equal(activeDaysInMonth(days, 2026, 10), 2)
})

test('weekRows fills empty days and adds up the total', () => {
  const { rows, total } = weekRows([{ date: '2026-11-12', reading: 1, listening: 1, minutes: 45 }], '2026-11-14')
  assert.equal(rows.length, 7)
  assert.deepEqual(rows[3], { date: '2026-11-12', reading: 1, listening: 1, minutes: 45 })
  assert.deepEqual(total, { reading: 1, listening: 1, minutes: 45 })
})

test('toKey and displayDate', () => {
  assert.equal(toKey(new Date(2026, 0, 5)), '2026-01-05')
  assert.equal(displayDate('2026-11-14'), '14/11/2026')
})
