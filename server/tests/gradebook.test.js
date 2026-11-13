import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildGradebook, averageBand } from '../src/utils/gradebook.js'

const students = [
  { id: 's1', name: 'An' },
  { id: 's2', name: 'Bình' },
]
const tests = [
  { id: 't1', title: 'Reading 1', skill: 'reading' },
  { id: 't2', title: 'Listening 1', skill: 'listening' },
]

test('each cell is the latest submitted attempt of that student on that test', () => {
  const attempts = [
    { id: 'old', userId: 's1', testId: 't1', result: { correct: 20, total: 40, band: 5.5 }, submittedAt: '2026-11-12T08:00:00Z' },
    { id: 'new', userId: 's1', testId: 't1', result: { correct: 30, total: 40, band: 7 }, submittedAt: '2026-11-13T08:00:00Z' },
  ]

  const { rows } = buildGradebook(students, tests, attempts)

  assert.equal(rows[0].cells[0].attemptId, 'new')
  assert.equal(rows[0].cells[0].band, 7)
})

test('a test the student has not done is null', () => {
  const { rows } = buildGradebook(students, tests, [])

  assert.deepEqual(rows[1].cells, [null, null])
  assert.equal(rows[1].averageBand, null)
})

test('rows follow the student list and cells follow the test list', () => {
  const attempts = [{ id: 'a', userId: 's2', testId: 't2', result: { correct: 9, total: 13, band: null }, submittedAt: '2026-11-13T08:00:00Z' }]

  const { rows } = buildGradebook(students, tests, attempts)

  assert.deepEqual(rows.map((row) => row.student.id), ['s1', 's2'])
  assert.equal(rows[1].cells[0], null)
  assert.equal(rows[1].cells[1].correct, 9)
})

test('the average band ignores parts practice and rounds the IELTS way', () => {
  assert.equal(averageBand([{ band: 6 }, { band: 6.5 }]), 6.5) // 6.25 → 6.5
  assert.equal(averageBand([{ band: 6.5 }, { band: 7 }]), 7) // 6.75 → 7
  assert.equal(averageBand([{ band: 6 }, { band: null }, null]), 6)
})
