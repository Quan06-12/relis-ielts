import { test } from 'node:test'
import assert from 'node:assert/strict'
import { splitGap, groupHeading, isGapGroup, sectionProgress } from './questionText.js'

test('splitGap finds the underscores of a completion prompt', () => {
  assert.deepEqual(splitGap('Concrete absorbs ____ during the day.'), { before: 'Concrete absorbs ', after: ' during the day.', hasGap: true })
  assert.deepEqual(splitGap('Name the material'), { before: 'Name the material', after: '', hasGap: false })
  assert.deepEqual(splitGap('_'), { before: '_', after: '', hasGap: false })
})

test('groupHeading', () => {
  assert.equal(groupHeading([{ number: 1 }, { number: 7 }]), 'Questions 1–7')
  assert.equal(groupHeading([{ number: 5 }]), 'Question 5')
  assert.equal(groupHeading([]), '')
})

test('isGapGroup and sectionProgress', () => {
  assert.equal(isGapGroup('completion'), true)
  assert.equal(isGapGroup('tfng'), false)
  const questions = [{ id: 'a', sectionPosition: 0 }, { id: 'b', sectionPosition: 0 }, { id: 'c', sectionPosition: 1 }]
  const progress = sectionProgress(questions, 0, (question) => question.id === 'a')
  assert.equal(progress.questions.length, 2)
  assert.equal(progress.answered, 1)
})
