import { test } from 'node:test'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'
import { normalizeAnswer, isCorrectAnswer, gradeAttempt } from '../src/utils/grading.js'

test('case and extra spaces do not matter', () => {
  assert.equal(normalizeAnswer('  The   Rooftop '), 'the rooftop')
  assert.equal(isCorrectAnswer('completion', ['pedals'], [' PEDALS ']), true)
})

test('any of the accepted answers is right', () => {
  assert.equal(isCorrectAnswer('short_answer', ['10', 'ten'], ['Ten']), true)
  assert.equal(isCorrectAnswer('short_answer', ['10', 'ten'], ['eleven']), false)
})

test('an empty answer is wrong', () => {
  assert.equal(isCorrectAnswer('tfng', ['TRUE'], []), false)
  assert.equal(isCorrectAnswer('completion', ['pedals'], ['   ']), false)
})

test('multi_select must match the accepted set exactly, in any order', () => {
  assert.equal(isCorrectAnswer('multi_select', ['B', 'D'], ['D', 'B']), true)
  assert.equal(isCorrectAnswer('multi_select', ['B', 'D'], ['B']), false)
  assert.equal(isCorrectAnswer('multi_select', ['B', 'D'], ['B', 'D', 'E']), false)
})

// A test with `count` TRUE/FALSE questions in one section, answer always TRUE
function makeTest(skill, sectionSizes) {
  return {
    skill,
    sections: sectionSizes.map((count) => ({
      groups: [
        {
          type: 'tfng',
          questions: Array.from({ length: count }, () => ({ _id: new mongoose.Types.ObjectId(), answers: ['TRUE'] })),
        },
      ],
    })),
  }
}

function answerAll(test, value, howMany = Infinity) {
  const questions = test.sections.flatMap((section) => section.groups.flatMap((group) => group.questions))
  return questions.slice(0, howMany).map((question) => ({ questionId: question._id, value: [value] }))
}

test('a full 40-question test gets a band', () => {
  const fullTest = makeTest('reading', [13, 13, 14])
  const { result } = gradeAttempt(fullTest, answerAll(fullTest, 'TRUE', 30), { type: 'full', sectionIndexes: [0, 1, 2] })

  assert.deepEqual(result, { correct: 30, total: 40, band: 7 })
})

test('practising some sections gives no band and only counts those sections', () => {
  const fullTest = makeTest('reading', [13, 13, 14])
  const { result, answers } = gradeAttempt(fullTest, answerAll(fullTest, 'TRUE'), { type: 'parts', sectionIndexes: [1] })

  assert.deepEqual(result, { correct: 13, total: 13, band: null })
  assert.equal(answers.length, 13)
})

test('unanswered questions are listed as wrong', () => {
  const shortTest = makeTest('listening', [3])
  const { answers, result } = gradeAttempt(shortTest, answerAll(shortTest, 'TRUE', 1), { type: 'parts', sectionIndexes: [0] })

  assert.deepEqual(answers.map((answer) => answer.correct), [true, false, false])
  assert.deepEqual(answers[2].value, [])
  assert.equal(result.correct, 1)
})
