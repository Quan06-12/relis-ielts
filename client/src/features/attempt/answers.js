// Small pure helpers for the attempt page, unit tested.

// Every question of the chosen sections, in order, with its section and group attached.
export function questionsOf(sections) {
  return sections.flatMap((section, sectionPosition) =>
    section.groups.flatMap((group) => group.questions.map((question) => ({ ...question, sectionPosition, group })))
  )
}

export function isAnswered(value) {
  return Array.isArray(value) && value.some((item) => item.trim() !== '')
}

// How many questions are still empty; shown before submitting early (US32).
export function countUnanswered(questions, answersByQuestion) {
  return questions.filter((question) => !isAnswered(answersByQuestion[question.id])).length
}

// 3725 seconds → "62:05"
export function formatClock(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
