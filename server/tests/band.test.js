import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bandFromCorrect } from '../src/utils/band.js'

test('top and bottom of the table', () => {
  assert.equal(bandFromCorrect('reading', 40), 9)
  assert.equal(bandFromCorrect('reading', 39), 9)
  assert.equal(bandFromCorrect('listening', 4), 2.5)
  assert.equal(bandFromCorrect('listening', 3), 0)
})

test('rows where Listening and Reading differ', () => {
  assert.equal(bandFromCorrect('listening', 32), 7.5)
  assert.equal(bandFromCorrect('reading', 32), 7)
  assert.equal(bandFromCorrect('listening', 26), 6.5)
  assert.equal(bandFromCorrect('reading', 26), 6)
  assert.equal(bandFromCorrect('listening', 18), 5.5)
  assert.equal(bandFromCorrect('reading', 18), 5)
  assert.equal(bandFromCorrect('listening', 15), 4.5)
  assert.equal(bandFromCorrect('reading', 15), 5)
})

test('both ends of a range give the same band', () => {
  assert.equal(bandFromCorrect('reading', 30), 7)
  assert.equal(bandFromCorrect('reading', 31), 7)
  assert.equal(bandFromCorrect('reading', 23), 6)
  assert.equal(bandFromCorrect('reading', 25), 6)
})
