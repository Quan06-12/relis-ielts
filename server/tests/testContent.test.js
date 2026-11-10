import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  newTestLayout,
  listQuestions,
  renumberQuestions,
  findQuestionsWithoutAnswer,
  toPlayView,
} from '../src/utils/testContent.js'
import { sampleSections } from './helpers/sampleTest.js'

test('a full Reading test starts with 3 passages and 60 minutes', () => {
  const layout = newTestLayout('reading', 'full')
  assert.equal(layout.sections.length, 3)
  assert.equal(layout.durationMin, 60)
})

test('a full Listening test starts with 4 parts and 40 minutes', () => {
  const layout = newTestLayout('listening', 'full')
  assert.equal(layout.sections.length, 4)
  assert.equal(layout.sections[3].title, 'Part 4')
  assert.equal(layout.durationMin, 40)
})

test('questions are numbered 1..n across all sections', () => {
  const sections = sampleSections()
  const count = renumberQuestions(sections)

  assert.equal(count, 3)
  assert.deepEqual(listQuestions(sections).map((question) => question.number), [1, 2, 3])
})

test('listQuestions can keep only some sections', () => {
  const sections = sampleSections()
  assert.equal(listQuestions(sections, [1]).length, 1)
})

test('questions without an answer are reported by number', () => {
  const sections = sampleSections()
  sections[1].groups[0].questions[0].answers = ['  ']
  renumberQuestions(sections)

  assert.deepEqual(findQuestionsWithoutAnswer(sections), [3])
})

test('the play view never contains answers, explanations, evidence or transcripts', () => {
  const sections = sampleSections()
  sections[0].transcript = 'secret transcript'
  sections[0].groups[0].questions[0].explanation = ['Line 1 says so']
  sections[0].groups[0].questions[0].evidence = { start: 0, end: 10 }
  renumberQuestions(sections)

  const view = toPlayView({ _id: 'abc', title: 'T', skill: 'reading', kind: 'full', durationMin: 60, questionCount: 3, sections })
  const json = JSON.stringify(view)

  for (const secret of ['answers', 'explanation', 'evidence', 'transcript', 'TRUE"]', 'pedals"]']) {
    assert.ok(!json.includes(secret), `play view must not contain ${secret}`)
  }
  assert.equal(view.sections[0].groups[0].questions[0].prompt, 'Rooftop gardens cool the city.')
})
