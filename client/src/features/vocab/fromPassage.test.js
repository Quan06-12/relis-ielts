import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sentenceAround, termFrom } from './fromPassage.js'

const passage = 'Cities are warm. Green roofs cool them, which reduces energy use! Do they work?\nYes.'

test('sentenceAround returns the sentence that holds the selection, with its full stop', () => {
  const start = passage.indexOf('cool')
  assert.equal(sentenceAround(passage, start, start + 4), 'Green roofs cool them, which reduces energy use!')
})

test('sentenceAround stops at line breaks and at the start of the passage', () => {
  assert.equal(sentenceAround(passage, 0, 6), 'Cities are warm.')
  const start = passage.indexOf('Yes')
  assert.equal(sentenceAround(passage, start, start + 3), 'Yes.')
})

test('termFrom tidies spaces and removes punctuation at the edges', () => {
  assert.equal(termFrom('  “mitigate,” '), 'mitigate')
  assert.equal(termFrom('run\n off.'), 'run off')
  assert.equal(termFrom("city's"), "city's")
})
