import { test } from 'node:test'
import assert from 'node:assert/strict'
import { findEvidence } from '../src/utils/evidenceRange.js'
import { demoReadingTest, demoShortTest } from '../scripts/demoData.js'

test('a quote is turned into its character range', () => {
  assert.deepEqual(findEvidence('Rooftop gardens cool the city.', 'cool the city'), { start: 16, end: 29 })
})

test('a quote that is not in the text is reported', () => {
  assert.throws(() => findEvidence('abc', 'xyz'), /Evidence not found/)
})

test('the demo full test has 40 questions, each with an answer, an explanation and evidence inside its passage', () => {
  for (const demo of [demoReadingTest(), demoShortTest()]) {
    for (const section of demo.sections) {
      for (const group of section.groups) {
        for (const question of group.questions) {
          assert.ok(question.answers.length > 0, question.prompt)
          assert.ok(question.explanation.length > 0, question.prompt)
          assert.equal(section.passage.slice(question.evidence.start, question.evidence.end).length > 0, true)
          // Choice questions: every accepted answer is one of the options
          if (question.options.length > 0) {
            assert.ok(question.answers.every((answer) => question.options.includes(answer)), question.prompt)
          }
        }
      }
    }
  }
  const count = demoReadingTest().sections.flatMap((section) => section.groups.flatMap((group) => group.questions)).length
  assert.equal(count, 40)
})
