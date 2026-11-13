import { test } from 'node:test'
import assert from 'node:assert/strict'
import { splitByEvidence, answerStatus, formatDuration, formatValue } from './reviewHelpers.js'

test('the passage is cut into before, marked and after', () => {
  assert.deepEqual(splitByEvidence('Rooftop gardens cool the city.', { start: 8, end: 15 }), {
    before: 'Rooftop ',
    marked: 'gardens',
    after: ' cool the city.',
  })
})

test('missing or broken evidence gives null', () => {
  assert.equal(splitByEvidence('abc', null), null)
  assert.equal(splitByEvidence('abc', { start: 2, end: 2 }), null)
  assert.equal(splitByEvidence('', { start: 0, end: 1 }), null)
})

test('evidence past the end of the text is cut to the text', () => {
  assert.equal(splitByEvidence('abc', { start: 1, end: 99 }).marked, 'bc')
})

test('answer status', () => {
  assert.equal(answerStatus({ value: ['TRUE'], correct: true }), 'correct')
  assert.equal(answerStatus({ value: ['FALSE'], correct: false }), 'wrong')
  assert.equal(answerStatus({ value: [' '], correct: false }), 'blank')
  assert.equal(answerStatus(undefined), 'blank')
})

test('duration and answer text', () => {
  assert.equal(formatDuration('2026-11-13T03:00:00Z', '2026-11-13T03:42:05Z'), '42 phút 05 giây')
  assert.equal(formatValue(['B', 'D']), 'B, D')
  assert.equal(formatValue([]), '(bỏ trống)')
})
