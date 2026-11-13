import { test } from 'node:test'
import assert from 'node:assert/strict'
import { questionsOf, isAnswered, countUnanswered, formatClock } from './answers.js'

const sections = [
  { groups: [{ type: 'tfng', questions: [{ id: 'q1' }, { id: 'q2' }] }] },
  { groups: [{ type: 'completion', questions: [{ id: 'q3' }] }] },
]

test('questions keep the position of their section', () => {
  assert.deepEqual(questionsOf(sections).map((question) => [question.id, question.sectionPosition]), [
    ['q1', 0],
    ['q2', 0],
    ['q3', 1],
  ])
})

test('blank text does not count as an answer', () => {
  assert.equal(isAnswered(['  ']), false)
  assert.equal(isAnswered(['TRUE']), true)
  assert.equal(isAnswered(undefined), false)
})

test('unanswered questions are counted', () => {
  assert.equal(countUnanswered(questionsOf(sections), { q1: ['TRUE'], q3: [''] }), 2)
})

test('clock shows minutes and seconds with two digits', () => {
  assert.equal(formatClock(3725), '62:05')
  assert.equal(formatClock(9), '00:09')
})
