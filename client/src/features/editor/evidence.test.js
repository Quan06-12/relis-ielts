import { test } from 'node:test'
import assert from 'node:assert/strict'
import { evidenceFromSelection, evidenceSnippet, isEvidenceOutOfRange } from './evidence.js'

const text = 'Rooftop gardens  cool the city.\nThey also reduce noise.'

test('a selection becomes a range without spaces at its ends', () => {
  // "  cool" selected with the two spaces before it
  assert.deepEqual(evidenceFromSelection(text, 15, 21), { start: 17, end: 21 })
})

test('an empty selection or only spaces gives null', () => {
  assert.equal(evidenceFromSelection(text, 5, 5), null)
  assert.equal(evidenceFromSelection(text, 15, 17), null)
  assert.equal(evidenceFromSelection(text, undefined, 3), null)
})

test('the snippet is the selected text, shortened in the middle when long', () => {
  assert.equal(evidenceSnippet(text, { start: 0, end: 15 }), 'Rooftop gardens')
  const long = evidenceSnippet('a'.repeat(300), { start: 0, end: 300 }, 21)
  assert.equal(long.length, 21)
  assert.ok(long.includes('…'))
})

test('evidence past the end of a shortened passage is detected', () => {
  assert.equal(isEvidenceOutOfRange('short', { start: 0, end: 10 }), true)
  assert.equal(isEvidenceOutOfRange(text, { start: 0, end: 10 }), false)
  assert.equal(isEvidenceOutOfRange(text, null), false)
})
