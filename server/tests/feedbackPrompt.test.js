import { test } from 'node:test'
import assert from 'node:assert/strict'
import { accuracyByType, buildFeedbackPrompt, parseFeedback } from '../src/utils/feedbackPrompt.js'

const sampleTest = {
  sections: [
    { groups: [{ type: 'tfng', questions: [{ _id: 'q1' }, { _id: 'q2' }] }] },
    { groups: [{ type: 'completion', questions: [{ _id: 'q3' }] }] },
  ],
}

test('accuracy is counted per question type, only for the sections taken', () => {
  const answers = [
    { questionId: 'q1', correct: true },
    { questionId: 'q2', correct: false },
    { questionId: 'q3', correct: true },
  ]

  assert.deepEqual(accuracyByType(sampleTest, answers, [0, 1]), [
    { type: 'tfng', correct: 1, total: 2 },
    { type: 'completion', correct: 1, total: 1 },
  ])
  assert.deepEqual(accuracyByType(sampleTest, answers, [1]), [{ type: 'completion', correct: 1, total: 1 }])
})

test('the prompt has the score and each question type, and asks for JSON', () => {
  const prompt = buildFeedbackPrompt({
    skill: 'reading',
    result: { correct: 30, total: 40, band: 7 },
    byType: [{ type: 'tfng', correct: 8, total: 13 }],
  })

  assert.match(prompt, /30\/40 correct, band 7/)
  assert.match(prompt, /True\/False\/Not Given: 8\/13 correct/)
  assert.match(prompt, /JSON only/)
})

test('a JSON reply, even inside ``` fences, is read and the lists are capped', () => {
  const reply = '```json\n{"summary": "Tốt", "weakTypes": ["A", "B", "C"], "tips": ["1", "2", "3", "4", ""]}\n```'

  assert.deepEqual(parseFeedback(reply), { summary: 'Tốt', weakTypes: ['A', 'B'], tips: ['1', '2', '3'] })
})

test('a reply without JSON or without a summary is refused', () => {
  assert.throws(() => parseFeedback('Sorry, I cannot help'))
  assert.throws(() => parseFeedback('{"tips": ["x"]}'))
})
