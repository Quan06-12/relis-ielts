import { test } from 'node:test'
import assert from 'node:assert/strict'
import { secondsLeft, isPastDeadline } from '../src/utils/attemptTimer.js'

const startedAt = new Date('2026-11-09T03:00:00Z')
const attempt = { startedAt, mode: { timeLimitMin: 60 } }
const after = (seconds) => new Date(startedAt.getTime() + seconds * 1000)

test('time left counts down from the time limit', () => {
  assert.equal(secondsLeft(attempt, startedAt), 3600)
  assert.equal(secondsLeft(attempt, after(600)), 3000)
})

test('time left never goes below zero', () => {
  assert.equal(secondsLeft(attempt, after(4000)), 0)
})

test('the last fraction of a second is still before the deadline', () => {
  assert.equal(secondsLeft(attempt, after(3599.5)), 1)
  assert.equal(isPastDeadline(attempt, after(3599.999)), false)
})

test('answers close exactly at the deadline', () => {
  assert.equal(secondsLeft(attempt, after(3600)), 0)
  assert.equal(isPastDeadline(attempt, after(3600)), true)
})

test('network delay never extends the answer deadline', () => {
  assert.equal(isPastDeadline(attempt, after(3605)), true)
  assert.equal(isPastDeadline(attempt, after(3610)), true)
})
