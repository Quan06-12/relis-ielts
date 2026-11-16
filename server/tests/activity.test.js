import { test } from 'node:test'
import assert from 'node:assert/strict'
import { dayKey, safeTimeZone, attemptMinutes, activityByDay, currentStreak, lastMonths, studyTimeByMonth } from '../src/utils/activity.js'

test('dayKey uses the time zone: 20:00 UTC is already the next day in Vietnam', () => {
  const moment = new Date('2026-11-13T20:00:00Z')
  assert.equal(dayKey(moment, 'UTC'), '2026-11-13')
  assert.equal(dayKey(moment, 'Asia/Ho_Chi_Minh'), '2026-11-14')
})

test('safeTimeZone falls back on a name it does not know', () => {
  assert.equal(safeTimeZone('Asia/Bangkok'), 'Asia/Bangkok')
  assert.equal(safeTimeZone('Not/AZone'), 'Asia/Ho_Chi_Minh')
})

test('attemptMinutes is capped by the time limit', () => {
  const start = new Date('2026-11-14T01:00:00Z')
  assert.equal(attemptMinutes({ startedAt: start, submittedAt: new Date(start.getTime() + 33 * 60000), mode: { timeLimitMin: 60 } }), 33)
  assert.equal(attemptMinutes({ startedAt: start, submittedAt: new Date(start.getTime() + 600 * 60000), mode: { timeLimitMin: 60 } }), 60)
})

test('activityByDay counts each skill and adds up minutes per day', () => {
  const skills = new Map([['r', 'reading'], ['l', 'listening']])
  const at = (iso, testId, minutes) => ({ testId, submittedAt: new Date(iso), startedAt: new Date(new Date(iso) - minutes * 60000), mode: { timeLimitMin: 60 } })
  const rows = activityByDay(
    [at('2026-11-14T03:00:00Z', 'r', 20), at('2026-11-14T05:00:00Z', 'l', 12), at('2026-11-12T03:00:00Z', 'r', 30)],
    skills,
    'Asia/Ho_Chi_Minh',
  )
  assert.deepEqual(rows, [
    { date: '2026-11-12', reading: 1, listening: 0, minutes: 30 },
    { date: '2026-11-14', reading: 1, listening: 1, minutes: 32 },
  ])
})

test('currentStreak counts back from today, or from yesterday when today is still empty', () => {
  const days = ['2026-11-11', '2026-11-12', '2026-11-13']
  assert.equal(currentStreak(days, '2026-11-13'), 3)
  assert.equal(currentStreak(days, '2026-11-14'), 3)
  assert.equal(currentStreak(days, '2026-11-15'), 0)
  assert.equal(currentStreak([], '2026-11-15'), 0)
})

test('lastMonths lists the months up to today, across a new year', () => {
  assert.deepEqual(lastMonths('2026-02-10', 3), ['2025-12', '2026-01', '2026-02'])
})

test('studyTimeByMonth adds minutes per skill and keeps empty months', () => {
  const at = (submittedAt, minutes, testId) => ({
    testId,
    mode: { timeLimitMin: 60 },
    startedAt: new Date(Date.parse(submittedAt) - minutes * 60000).toISOString(),
    submittedAt,
  })
  const skills = new Map([['r', 'reading'], ['l', 'listening']])
  const attempts = [
    at('2026-10-05T03:00:00Z', 40, 'r'),
    at('2026-10-20T03:00:00Z', 20, 'l'),
    // 31/10 20:00 UTC is already 1/11 in Vietnam
    at('2026-10-31T20:00:00Z', 30, 'r'),
    // Older than the chart: ignored
    at('2026-06-01T03:00:00Z', 50, 'r'),
  ]

  const rows = studyTimeByMonth(attempts, skills, 'Asia/Ho_Chi_Minh', ['2026-09', '2026-10', '2026-11'])

  assert.deepEqual(rows, [
    { month: '2026-09', readingMinutes: 0, listeningMinutes: 0 },
    { month: '2026-10', readingMinutes: 40, listeningMinutes: 20 },
    { month: '2026-11', readingMinutes: 30, listeningMinutes: 0 },
  ])
})
