import { test } from 'node:test'
import assert from 'node:assert/strict'
import { grade } from '../src/utils/grade.js'
import { toBand, overallBand } from '../src/utils/band.js'

test('normalize, alternatives, all seven types, blanks, section selection', () => {
  const types = ['mcq', 'multi_select', 'tfng', 'ynng', 'matching', 'completion', 'short_answer']
  const test = {
    skill: 'reading',
    sections: [
      {
        groups: types.map((type, i) => ({
          type,
          questions: [
            { id: String(i), answers: type === 'multi_select' ? ['A', 'C'] : ['ten', '10'] },
          ],
        })),
      },
      { groups: [{ type: 'completion', questions: [{ id: 'excluded', answers: ['x'] }] }] },
    ],
  }
  const answers = types.map((type, i) => ({
    questionId: String(i),
    value: type === 'multi_select' ? ['c', 'a'] : [i === 6 ? '' : '  TEN  '],
  }))
  const result = grade(test, answers, { type: 'parts', sectionIndexes: [0] })
  assert.deepEqual(result.result, { correct: 6, total: 7, band: null })
  assert.equal(
    grade(test, [{ questionId: '1', value: ['A'] }], { type: 'parts', sectionIndexes: [0] }).result
      .correct,
    0,
  )
})
test('band table follows project boundaries; undefined 0..3 remain null', () => {
  for (const [score, listening, reading] of [
    [40, 9, 9],
    [39, 9, 9],
    [38, 8.5, 8.5],
    [35, 8, 8],
    [33, 7.5, 7.5],
    [32, 7.5, 7],
    [30, 7, 7],
    [27, 6.5, 6.5],
    [26, 6.5, 6],
    [23, 6, 6],
    [19, 5.5, 5.5],
    [18, 5.5, 5],
    [16, 5, 5],
    [15, 4.5, 5],
    [13, 4.5, 4.5],
    [10, 4, 4],
    [8, 3.5, 3.5],
    [6, 3, 3],
    [4, 2.5, 2.5],
    [3, null, null],
    [0, null, null],
  ]) {
    assert.equal(toBand(score, 'listening'), listening)
    assert.equal(toBand(score, 'reading'), reading)
  }
  assert.equal(overallBand(6, 6.5), 6.5)
  assert.equal(overallBand(6.5, 7), 7)
  assert.equal(overallBand(null, 7), null)
})
test('band only on full 40; whitespace collapsed; no partial multi-select credit', () => {
  const t = {
    skill: 'reading',
    sections: [
      {
        groups: [
          {
            type: 'completion',
            questions: Array.from({ length: 40 }, (_, i) => ({
              id: String(i),
              answers: ['red bus'],
            })),
          },
        ],
      },
    ],
  }
  const answers = Array.from({ length: 40 }, (_, i) => ({
    questionId: String(i),
    value: [' Red   BUS '],
  }))
  assert.equal(grade(t, answers, { type: 'full', sectionIndexes: [0] }).result.band, 9)
  assert.equal(grade(t, answers, { type: 'parts', sectionIndexes: [0] }).result.band, null)
})
