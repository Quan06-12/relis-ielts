import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mondayKey, buildLeaderboard } from '../src/utils/leaderboard.js'

test('mondayKey', () => {
  assert.equal(mondayKey('2026-11-15'), '2026-11-09') // Sunday → the Monday before
  assert.equal(mondayKey('2026-11-09'), '2026-11-09')
})

// An attempt submitted at noon UTC on a day, taking 30 minutes
const attempt = (userId, day, band = null) => ({
  userId,
  submittedAt: new Date(`${day}T12:00:00Z`),
  startedAt: new Date(`${day}T11:30:00Z`),
  mode: { timeLimitMin: 60 },
  result: { band },
})

test('buildLeaderboard ranks this week by submissions and compares with last week', () => {
  const students = [{ id: 'a', name: 'An' }, { id: 'b', name: 'Bình' }, { id: 'c', name: 'Chi' }]
  const attempts = [
    // last week: An 2, Bình 1
    attempt('a', '2026-11-03'), attempt('a', '2026-11-04'), attempt('b', '2026-11-05'),
    // this week: Bình 2, An 1, Chi 0
    attempt('b', '2026-11-10', 6.5), attempt('b', '2026-11-12', 7.0), attempt('a', '2026-11-11'),
  ]

  const rows = buildLeaderboard(students, attempts, '2026-11-15', 'UTC')

  assert.deepEqual(rows.map((row) => [row.name, row.rank, row.count, row.change]), [
    ['Bình', 1, 2, 1], // was 2nd
    ['An', 2, 1, -1], // was 1st
    ['Chi', 3, 0, null], // nothing last week
  ])
  assert.equal(rows[0].minutes, 60)
  assert.equal(rows[0].averageBand, 7) // (6.5 + 7) / 2 = 6.75 → 7.0
  assert.equal(rows[1].averageBand, null)
})

test('buildLeaderboard gives the same rank to a tie', () => {
  const students = [{ id: 'a', name: 'An' }, { id: 'b', name: 'Bình' }]
  const rows = buildLeaderboard(students, [], '2026-11-15', 'UTC')
  assert.deepEqual(rows.map((row) => row.rank), [1, 1])
})
