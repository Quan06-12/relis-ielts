import { test } from 'node:test'
import assert from 'node:assert/strict'
import { wallCards, SAMPLE_TESTS } from './wall.js'

test('wallCards makes columns × rows cards and neighbours in a column differ', () => {
  const cards = wallCards(4, 5)
  assert.equal(cards.length, 20)
  assert.notEqual(cards[0].test.title, cards[1].test.title)
  assert.ok(cards.every((card) => SAMPLE_TESTS.includes(card.test)))
})
