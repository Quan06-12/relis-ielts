import { test } from 'node:test'
import assert from 'node:assert/strict'
import { timeChoices } from './timeOptions.js'

test('full Reading test defaults to 60 minutes', () => {
  assert.equal(timeChoices('reading', true, 3).default, 60)
})

test('one Reading passage defaults to 20 minutes', () => {
  assert.deepEqual(timeChoices('reading', false, 1), { choices: [10, 15, 20, 25, 30], default: 20 })
})

test('two Listening parts double every choice', () => {
  assert.deepEqual(timeChoices('listening', false, 2), { choices: [10, 20, 30, 40], default: 20 })
})
