import { test } from 'node:test'
import assert from 'node:assert/strict'
import { groupByStatus, timeLeftLabel, defaultDeadlineInput } from './assignmentDisplay.js'

test('groups start with work in progress and leave out empty groups', () => {
  const groups = groupByStatus([
    { id: 'a', myStatus: 'submitted' },
    { id: 'b', myStatus: 'todo' },
    { id: 'c', myStatus: 'in_progress' },
  ])

  assert.deepEqual(groups.map((group) => group.label), ['Đang làm', 'Cần làm', 'Đã nộp'])
})

test('time left before the deadline', () => {
  const now = new Date('2026-11-14T10:00:00Z')
  assert.equal(timeLeftLabel('2026-11-14T10:40:00Z', now), 'còn 40 phút')
  assert.equal(timeLeftLabel('2026-11-14T15:00:00Z', now), 'còn 5 giờ')
  assert.equal(timeLeftLabel('2026-11-16T11:00:00Z', now), 'còn 2 ngày')
  assert.equal(timeLeftLabel('2026-11-14T09:00:00Z', now), 'đã hết hạn')
})

test('the default deadline is one week later at 23:59', () => {
  assert.equal(defaultDeadlineInput(new Date(2026, 10, 14, 9, 30)), '2026-11-21T23:59')
})
