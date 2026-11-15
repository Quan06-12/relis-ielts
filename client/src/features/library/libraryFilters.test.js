import { test } from 'node:test'
import assert from 'node:assert/strict'
import { filterByQuestionType, questionTypesIn, QUESTION_TYPE_LABELS } from './libraryFilters.js'

const tests = [
  { id: 'a', questionTypes: ['tfng', 'completion'] },
  { id: 'b', questionTypes: ['mcq'] },
  { id: 'c' },
]

test('filterByQuestionType keeps tests that use the type', () => {
  assert.deepEqual(filterByQuestionType(tests, 'completion').map((t) => t.id), ['a'])
  assert.equal(filterByQuestionType(tests, '').length, 3)
})

test('questionTypesIn lists each type once', () => {
  assert.deepEqual(questionTypesIn(tests), ['tfng', 'completion', 'mcq'])
  assert.equal(QUESTION_TYPE_LABELS.completion, 'Gap Filling')
})
