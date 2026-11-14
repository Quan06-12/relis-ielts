import { test } from 'node:test'
import assert from 'node:assert/strict'
import { clampRatio, ratioFromPointer } from './splitRatio.js'

test('the ratio follows the pointer inside the container', () => {
  assert.equal(ratioFromPointer(500, 100, 800), 0.5)
  assert.equal(ratioFromPointer(420, 100, 800), 0.4)
})

test('neither pane can go below a quarter', () => {
  assert.equal(ratioFromPointer(110, 100, 800), 0.25)
  assert.equal(ratioFromPointer(890, 100, 800), 0.75)
  assert.equal(clampRatio(-1), 0.25)
})

test('a container with no size keeps the middle', () => {
  assert.equal(ratioFromPointer(10, 0, 0), 0.5)
})
