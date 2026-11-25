import { test } from 'node:test'
import assert from 'node:assert/strict'
import { teacherOverview, studentOverview } from './classOverview.js'

const now = new Date('2026-11-25T10:00:00')
const assignment = (fields) => ({ deadline: '2026-11-28T09:00:00', test: { title: 'Night Train' }, ...fields })

test('teacher overview: class band, hand-in rate and the closest deadline', () => {
  const tiles = teacherOverview({
    now,
    studentCount: 3,
    gradebook: { rows: [{ averageBand: 6.5 }, { averageBand: 7 }, { averageBand: null }] },
    assignments: [
      assignment({ studentCount: 3, submittedCount: 1 }),
      assignment({ deadline: '2026-11-20T09:00:00', studentCount: 3, submittedCount: 3 }),
    ],
  })
  const byKey = Object.fromEntries(tiles.map((tile) => [tile.key, tile]))
  assert.equal(byKey.students.value, '3')
  assert.equal(byKey.band.value, '7.0', '6.75 rounds up to 7.0 like IELTS')
  assert.equal(byKey.rate.value, '67%')
  assert.equal(byKey.rate.detail, '4/6 lượt nộp')
  assert.equal(byKey.deadline.value, '2 ngày')
})

test('teacher overview without assignments or full tests shows dashes', () => {
  const byKey = Object.fromEntries(teacherOverview({ now, studentCount: 0, gradebook: null, assignments: [] }).map((tile) => [tile.key, tile]))
  assert.equal(byKey.band.value, '—')
  assert.equal(byKey.rate.value, '—')
  assert.equal(byKey.deadline.value, '—')
})

test('student overview counts work to do and handed in', () => {
  const byKey = Object.fromEntries(
    studentOverview({
      now,
      assignments: [assignment({ myStatus: 'todo' }), assignment({ myStatus: 'submitted' }), assignment({ myStatus: 'missed', deadline: '2026-11-01' })],
    }).map((tile) => [tile.key, tile])
  )
  assert.equal(byKey.todo.value, '1')
  assert.equal(byKey.done.value, '1')
  assert.equal(byKey.deadline.value, '2 ngày')
})
