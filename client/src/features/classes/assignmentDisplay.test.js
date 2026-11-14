import { test } from 'node:test'
import assert from 'node:assert/strict'
import { groupByStatus, timeLeftLabel, defaultDeadlineInput, assignmentChips, shortDeadline, averageLabel } from './assignmentDisplay.js'

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

test('assignmentChips: skill, kind, open or closed', () => {
  const now = new Date(2026, 10, 14, 12, 0)
  const open = { test: { skill: 'reading', kind: 'full' }, deadline: new Date(2026, 10, 15), allowLate: false }
  const closed = { test: { skill: 'listening', kind: 'single' }, deadline: new Date(2026, 10, 13), allowLate: false }
  assert.deepEqual(assignmentChips(open, now).map((chip) => chip.label), ['Reading', 'Full test', 'Đang mở'])
  assert.deepEqual(assignmentChips(closed, now).map((chip) => chip.label), ['Listening', 'Một phần', 'Đã đóng'])
  assert.equal(assignmentChips({ ...closed, allowLate: true }, now).at(-1).label, 'Đang mở')
})

test('shortDeadline: hh:mm · dd/mm', () => {
  assert.equal(shortDeadline(new Date(2026, 10, 4, 20, 0)), '20:00 · 04/11')
})

test('averageLabel: band, then correct answers, then nothing', () => {
  assert.deepEqual(averageLabel({ averageBand: 6.5, averageCorrect: 30 }), { value: '6.5', unit: 'band TB' })
  assert.deepEqual(averageLabel({ averageBand: null, averageCorrect: 8.5, test: { questionCount: 13 } }), { value: '8.5/13', unit: 'câu đúng TB' })
  assert.equal(averageLabel({ averageBand: null, averageCorrect: null }).value, '—')
})
