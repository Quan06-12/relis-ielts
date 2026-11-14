import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isValidBand, checkProfileChanges } from '../src/utils/goals.js'

test('a band is 0 to 9 in steps of 0.5, or null', () => {
  assert.equal(isValidBand(6.5), true)
  assert.equal(isValidBand(0), true)
  assert.equal(isValidBand(null), true)
  assert.equal(isValidBand(6.3), false)
  assert.equal(isValidBand(9.5), false)
  assert.equal(isValidBand('7'), false)
})

test('valid profile changes have no problems', () => {
  assert.deepEqual(checkProfileChanges({ goals: { reading: 7, overall: null }, examDate: '2026-12-20' }), [])
  assert.deepEqual(checkProfileChanges({}), [])
})

test('each wrong field is reported', () => {
  const problems = checkProfileChanges({ goals: { listening: 10 }, examDate: 'next month' })

  assert.deepEqual(problems.map((problem) => problem.field), ['goals.listening', 'examDate'])
})
