// Pure helpers for showing questions the way the computer-delivered IELTS does. Unit tested.

// A completion prompt marks its gap with underscores: "Concrete absorbs ____ during the day."
// Returns the text before and after the gap; without a gap the input goes at the end.
export function splitGap(prompt) {
  const match = /_{2,}/.exec(prompt ?? '')
  if (!match) return { before: prompt ?? '', after: '', hasGap: false }
  return { before: prompt.slice(0, match.index), after: prompt.slice(match.index + match[0].length), hasGap: true }
}

// "Questions 1–7" for a group, "Question 5" when it has a single question
export function groupHeading(questions) {
  if (questions.length === 0) return ''
  const first = questions[0].number
  const last = questions.at(-1).number
  return first === last ? `Question ${first}` : `Questions ${first}–${last}`
}

// Groups whose answers are written into gaps inside a box of notes
export function isGapGroup(type) {
  return type === 'completion' || type === 'short_answer'
}

// Questions of one section (position in the chosen sections), and how many of them have an answer
export function sectionProgress(questions, sectionPosition, isAnswered) {
  const inSection = questions.filter((question) => question.sectionPosition === sectionPosition)
  return { questions: inSection, answered: inSection.filter(isAnswered).length }
}
