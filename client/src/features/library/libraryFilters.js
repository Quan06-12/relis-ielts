// Labels and filters for the test library page (US22, US23). Pure, unit tested.

// Names of the question types as IELTS candidates know them
export const QUESTION_TYPE_LABELS = {
  tfng: 'True - False - Not Given',
  ynng: 'Yes - No - Not Given',
  mcq: 'Multiple Choice (One Answer)',
  multi_select: 'Multiple Choice (Many Answers)',
  matching: 'Matching Information',
  completion: 'Gap Filling',
  short_answer: 'Short Answer',
}

// The left menu: everything, or one skill, optionally only full tests or only single sections
export const MENU = [
  { skill: 'reading', label: 'Reading', partWord: 'Passage' },
  { skill: 'listening', label: 'Listening', partWord: 'Part' },
]

// Tests that use the chosen question type ('' keeps all)
export function filterByQuestionType(tests, type) {
  if (!type) return tests
  return tests.filter((test) => (test.questionTypes ?? []).includes(type))
}

// Question types found in a list of tests, for the "Loại câu hỏi" choice
export function questionTypesIn(tests) {
  return [...new Set(tests.flatMap((test) => test.questionTypes ?? []))]
}
