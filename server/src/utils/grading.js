import { listQuestions } from './testContent.js'
import { bandFromCorrect } from './band.js'

// Scoring an attempt (US35). Pure functions: no database, so every rule has a unit test.

// " The  Rooftop " and "the rooftop" count as the same answer
export function normalizeAnswer(text) {
  return String(text ?? '').trim().replace(/\s+/g, ' ').toLowerCase()
}

// Is this answer right?
// - Most questions: the single answer must match one of the accepted answers ("10" or "ten").
// - multi_select ("Choose TWO letters"): the chosen options must be exactly the accepted ones, in any order.
export function isCorrectAnswer(groupType, acceptedAnswers, value) {
  const given = (value ?? []).map(normalizeAnswer).filter((item) => item !== '')
  const accepted = acceptedAnswers.map(normalizeAnswer).filter((item) => item !== '')
  if (given.length === 0) return false

  if (groupType === 'multi_select') {
    const givenSet = new Set(given)
    return givenSet.size === accepted.length && accepted.every((answer) => givenSet.has(answer))
  }

  return accepted.includes(given[0])
}

// Scores every question of the chosen sections.
// Returns the answers with `correct` filled in (unanswered questions included, as wrong)
// and the result. The band only exists for a full test of exactly 40 questions.
export function gradeAttempt(test, answers, mode) {
  const valueByQuestion = new Map(answers.map((answer) => [String(answer.questionId), answer.value]))

  const gradedAnswers = []
  for (const section of test.sections.filter((_, index) => mode.sectionIndexes.includes(index))) {
    for (const group of section.groups) {
      for (const question of group.questions) {
        const value = valueByQuestion.get(String(question._id)) ?? []
        gradedAnswers.push({ questionId: question._id, value, correct: isCorrectAnswer(group.type, question.answers, value) })
      }
    }
  }

  const correct = gradedAnswers.filter((answer) => answer.correct).length
  const total = listQuestions(test.sections, mode.sectionIndexes).length
  const band = mode.type === 'full' && total === 40 ? bandFromCorrect(test.skill, correct) : null

  return { answers: gradedAnswers, result: { correct, total, band } }
}
