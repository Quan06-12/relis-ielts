import { test } from 'node:test'
import assert from 'node:assert/strict'
import { teacherCardStats, studentCardStats } from '../src/utils/classCardStats.js'

const now = new Date('2026-11-14T10:00:00Z')

test('teacher card counts open assignments and submissions of the last 7 days', () => {
  const assignments = [{ deadline: '2026-11-20' }, { deadline: '2026-11-10' }]
  const attempts = [{ submittedAt: '2026-11-13' }, { submittedAt: '2026-11-01' }]

  assert.deepEqual(teacherCardStats(assignments, attempts, now), { openAssignmentCount: 1, recentSubmissionCount: 1 })
})

test('student card shows handed-in count and the nearest assignment still to do', () => {
  const assignments = [
    { id: 'a1', deadline: '2026-11-18', testTitle: 'Later' },
    { id: 'a2', deadline: '2026-11-15', testTitle: 'Soon' },
    { id: 'a3', deadline: '2026-11-16', testTitle: 'Done already' },
    { id: 'a4', deadline: '2026-11-01', testTitle: 'Missed' },
  ]

  const stats = studentCardStats(assignments, new Set(['a3']), now)

  assert.equal(stats.assignmentCount, 4)
  assert.equal(stats.submittedCount, 1)
  assert.deepEqual(stats.nextDue, { title: 'Soon', deadline: '2026-11-15' })
})

test('no assignment left to do gives no next deadline', () => {
  assert.equal(studentCardStats([], new Set(), now).nextDue, null)
})
