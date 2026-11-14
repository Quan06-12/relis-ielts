import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  findQuestion,
  firstQuestionWithoutAnswer,
  addGroup,
  addQuestion,
  updateQuestion,
  removeQuestion,
  updateSection,
  questionNumbers,
  questionsWithoutAnswer,
} from './editorState.js'

const emptyTest = () => ({ id: 't1', title: 'T', sections: [{ title: 'Passage 1', groups: [] }, { title: 'Passage 2', groups: [] }] })

test('adding a TRUE/FALSE/NOT GIVEN group starts with one question and the fixed options', () => {
  const edited = addGroup(emptyTest(), 0, 'tfng')
  const group = edited.sections[0].groups[0]

  assert.equal(group.type, 'tfng')
  assert.equal(group.questions.length, 1)
  assert.deepEqual(group.questions[0].options, ['TRUE', 'FALSE', 'NOT GIVEN'])
})

test('updates return a new object and never change the original', () => {
  const original = emptyTest()
  const edited = updateSection(original, 0, { passage: 'Text' })

  assert.equal(original.sections[0].passage, undefined)
  assert.equal(edited.sections[0].passage, 'Text')
})

test('a new question copies the options of the question above', () => {
  let edited = addGroup(emptyTest(), 0, 'matching')
  edited = updateQuestion(edited, 0, 0, 0, { options: ['i', 'ii', 'iii', 'iv', 'v', 'vi'] })
  edited = addQuestion(edited, 0, 0)

  assert.equal(edited.sections[0].groups[0].questions[1].options.length, 6)
})

test('questions are numbered across sections, like the student sees them', () => {
  let edited = addGroup(emptyTest(), 0, 'tfng')
  edited = addQuestion(edited, 0, 0)
  edited = addGroup(edited, 1, 'completion')
  const secondSectionQuestion = edited.sections[1].groups[0].questions[0]

  assert.equal(questionNumbers(edited)[secondSectionQuestion.key], 3)
})

test('questions without an answer are listed by number', () => {
  let edited = addGroup(emptyTest(), 0, 'tfng')
  edited = addQuestion(edited, 0, 0)
  edited = updateQuestion(edited, 0, 0, 0, { answers: ['TRUE'] })

  assert.deepEqual(questionsWithoutAnswer(edited), [2])

  edited = removeQuestion(edited, 0, 0, 1)
  assert.deepEqual(questionsWithoutAnswer(edited), [])
})

test('findQuestion and firstQuestionWithoutAnswer', () => {
  const sample = {
    sections: [
      { groups: [{ questions: [{ id: 'a', answers: ['TRUE'] }] }] },
      { groups: [{ questions: [{ id: 'b', answers: ['x'] }, { key: 'new-1', answers: [''] }] }] },
    ],
  }
  assert.deepEqual(findQuestion(sample, 'new-1'), { sectionIndex: 1, groupIndex: 0, questionIndex: 1 })
  assert.equal(findQuestion(sample, 'zzz'), null)
  assert.deepEqual(firstQuestionWithoutAnswer(sample), { sectionIndex: 1, key: 'new-1' })
})
