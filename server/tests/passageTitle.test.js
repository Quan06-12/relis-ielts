import { test } from 'node:test'
import assert from 'node:assert/strict'
import { withoutRepeatedTitle } from '../src/utils/passageTitle.js'

const section = (passage, evidence) => ({
  title: 'Green Roofs',
  passage,
  groups: [{ type: 'tfng', questions: [{ prompt: 'q', evidence }] }],
})

test('removes the title line and shifts evidence back by the removed length', () => {
  const passage = 'Green Roofs\n\nCities are warm. Roofs help.'
  const start = passage.indexOf('Roofs help')
  const fixed = withoutRepeatedTitle(section(passage, { start, end: start + 10 }))

  assert.equal(fixed.passage, 'Cities are warm. Roofs help.')
  const { evidence } = fixed.groups[0].questions[0]
  assert.equal(fixed.passage.slice(evidence.start, evidence.end), 'Roofs help')
})

test('leaves a passage alone when its first line is not the title', () => {
  assert.equal(withoutRepeatedTitle(section('Cities are warm.', null)), null)
  assert.equal(withoutRepeatedTitle({ title: '', passage: 'x', groups: [] }), null)
})
