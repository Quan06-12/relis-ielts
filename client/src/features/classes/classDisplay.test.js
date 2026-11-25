import { test } from 'node:test'
import assert from 'node:assert/strict'
import { scoreLevel, colorOf, formatScore, studentCountLabel, nextDueBox, splitByRole } from './classDisplay.js'

test('an unknown colour falls back to purple', () => {
  assert.equal(colorOf('blue'), '#1d4ed8')
  assert.equal(colorOf('rainbow'), '#5b3fd6')
})

test('a full test shows its band with one decimal', () => {
  assert.equal(formatScore({ band: 7, correct: 30, total: 40 }), '7.0')
})

test('parts practice shows correct/total, a missing test shows a dash', () => {
  assert.equal(formatScore({ band: null, correct: 9, total: 13 }), '9/13')
  assert.equal(formatScore(null), '—')
})

test('student count label', () => {
  assert.equal(studentCountLabel(3), '3 học viên')
  assert.equal(studentCountLabel(undefined), '0 học viên')
})

test('nextDueBox: nothing due, due today, due in a few days', () => {
  const now = new Date(2026, 10, 14, 10, 0)
  assert.equal(nextDueBox(null, now).tone, 'done')
  assert.deepEqual(nextDueBox({ title: 'Test 5', deadline: new Date(2026, 10, 14, 23, 0) }, now), {
    tone: 'urgent',
    heading: 'Hạn hôm nay',
    detail: 'Test 5',
  })
  assert.equal(nextDueBox({ title: 'Test 5', deadline: new Date(2026, 10, 16, 8, 0) }, now).heading, 'Sắp đến hạn · còn 2 ngày')
})

test('splitByRole', () => {
  const { teaching, studying } = splitByRole([{ myRole: 'teacher' }, { myRole: 'student' }, { myRole: 'teacher' }])
  assert.equal(teaching.length, 2)
  assert.equal(studying.length, 1)
})

test('scoreLevel colours a cell by band, or by share of correct answers', () => {
  assert.equal(scoreLevel({ band: 7.5 }), 'high')
  assert.equal(scoreLevel({ band: 6 }), 'mid')
  assert.equal(scoreLevel({ band: 5 }), 'low')
  assert.equal(scoreLevel({ band: null, correct: 10, total: 13 }), 'high')
  assert.equal(scoreLevel({ band: null, correct: 7, total: 13 }), 'mid')
  assert.equal(scoreLevel({ band: null, correct: 3, total: 13 }), 'low')
  assert.equal(scoreLevel(null), null)
})
