// Pure functions that change the test being edited. Each one returns a NEW test object
// (React only re-renders when the object changes), and none of them touch the server.

export const QUESTION_TYPES = [
  { value: 'tfng', label: 'TRUE / FALSE / NOT GIVEN', options: ['TRUE', 'FALSE', 'NOT GIVEN'] },
  { value: 'ynng', label: 'YES / NO / NOT GIVEN', options: ['YES', 'NO', 'NOT GIVEN'] },
  { value: 'mcq', label: 'Trắc nghiệm một đáp án', options: ['A', 'B', 'C', 'D'] },
  { value: 'multi_select', label: 'Chọn nhiều đáp án', options: ['A', 'B', 'C', 'D', 'E'] },
  { value: 'matching', label: 'Nối (matching)', options: ['i', 'ii', 'iii', 'iv'] },
  { value: 'completion', label: 'Điền từ vào chỗ trống', options: [] },
  { value: 'short_answer', label: 'Trả lời ngắn', options: [] },
]

// The answer is typed in (not chosen from options)
export function isTextType(type) {
  return type === 'completion' || type === 'short_answer'
}

// The options are fixed by IELTS and cannot be edited
export function hasFixedOptions(type) {
  return type === 'tfng' || type === 'ynng'
}

function defaultOptions(type) {
  return [...QUESTION_TYPES.find((item) => item.value === type).options]
}

// New questions get a temporary key for React until the server gives them an id
let nextKey = 1
function temporaryKey() {
  nextKey += 1
  return `new-${Date.now()}-${nextKey}`
}

export function newQuestion(type, previousQuestion = null) {
  return {
    key: temporaryKey(),
    prompt: '',
    // A new question reuses the options of the one above (e.g. the same list of headings)
    options: previousQuestion ? [...previousQuestion.options] : defaultOptions(type),
    answers: [],
    explanation: [],
    evidence: null,
  }
}

export function newGroup(type) {
  return { key: temporaryKey(), type, instruction: '', questions: [newQuestion(type)] }
}

// ---- updates: (test, positions..., changes) → new test ----

export function updateTest(test, changes) {
  return { ...test, ...changes }
}

export function updateSection(test, sectionIndex, changes) {
  const sections = test.sections.map((section, index) => (index === sectionIndex ? { ...section, ...changes } : section))
  return { ...test, sections }
}

function updateGroups(test, sectionIndex, changeGroups) {
  const section = test.sections[sectionIndex]
  return updateSection(test, sectionIndex, { groups: changeGroups(section.groups) })
}

export function addGroup(test, sectionIndex, type) {
  return updateGroups(test, sectionIndex, (groups) => [...groups, newGroup(type)])
}

export function updateGroup(test, sectionIndex, groupIndex, changes) {
  return updateGroups(test, sectionIndex, (groups) =>
    groups.map((group, index) => (index === groupIndex ? { ...group, ...changes } : group))
  )
}

export function removeGroup(test, sectionIndex, groupIndex) {
  return updateGroups(test, sectionIndex, (groups) => groups.filter((_, index) => index !== groupIndex))
}

function updateQuestions(test, sectionIndex, groupIndex, changeQuestions) {
  const group = test.sections[sectionIndex].groups[groupIndex]
  return updateGroup(test, sectionIndex, groupIndex, { questions: changeQuestions(group.questions, group) })
}

export function addQuestion(test, sectionIndex, groupIndex) {
  return updateQuestions(test, sectionIndex, groupIndex, (questions, group) => [
    ...questions,
    newQuestion(group.type, questions.at(-1)),
  ])
}

export function updateQuestion(test, sectionIndex, groupIndex, questionIndex, changes) {
  return updateQuestions(test, sectionIndex, groupIndex, (questions) =>
    questions.map((question, index) => (index === questionIndex ? { ...question, ...changes } : question))
  )
}

export function removeQuestion(test, sectionIndex, groupIndex, questionIndex) {
  return updateQuestions(test, sectionIndex, groupIndex, (questions) =>
    questions.filter((_, index) => index !== questionIndex)
  )
}

// ---- reading the test ----

// Question numbers as the student will see them: 1..n across the whole test.
// Returns a map from question id (or temporary key) to its number.
export function questionNumbers(test) {
  const numbers = {}
  let number = 0
  for (const section of test.sections) {
    for (const group of section.groups) {
      for (const question of group.questions) {
        number += 1
        numbers[question.id ?? question.key] = number
      }
    }
  }
  return numbers
}

// Numbers of questions with no correct answer yet; the test cannot be published until this is empty.
export function questionsWithoutAnswer(test) {
  const numbers = questionNumbers(test)
  return test.sections
    .flatMap((section) => section.groups.flatMap((group) => group.questions))
    .filter((question) => !question.answers.some((answer) => answer.trim() !== ''))
    .map((question) => numbers[question.id ?? question.key])
}
