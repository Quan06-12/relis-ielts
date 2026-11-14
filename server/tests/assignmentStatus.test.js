import { test } from 'node:test'
import assert from 'node:assert/strict'
import { assignmentStatus, canStartAssignment } from '../src/utils/assignmentStatus.js'

const now = new Date('2026-11-14T10:00:00Z')
const open = { deadline: '2026-11-15T10:00:00Z', allowLate: false }
const closed = { deadline: '2026-11-13T10:00:00Z', allowLate: false }
const closedButLateAllowed = { deadline: '2026-11-13T10:00:00Z', allowLate: true }

test('nothing started before the deadline is todo', () => {
  assert.equal(assignmentStatus(open, null, now), 'todo')
})

test('an unfinished attempt is in_progress', () => {
  assert.equal(assignmentStatus(open, { status: 'in_progress' }, now), 'in_progress')
})

test('handed in on time is submitted, after the deadline is late', () => {
  assert.equal(assignmentStatus(closed, { status: 'submitted', isLate: false }, now), 'submitted')
  assert.equal(assignmentStatus(closedButLateAllowed, { status: 'submitted', isLate: true }, now), 'late')
})

test('deadline passed with nothing handed in: missed, unless late work is allowed', () => {
  assert.equal(assignmentStatus(closed, null, now), 'missed')
  assert.equal(assignmentStatus(closedButLateAllowed, null, now), 'todo')
})

test('an assignment can be started before the deadline, or later when late work is allowed', () => {
  assert.equal(canStartAssignment(open, now), true)
  assert.equal(canStartAssignment(closed, now), false)
  assert.equal(canStartAssignment(closedButLateAllowed, now), true)
})
