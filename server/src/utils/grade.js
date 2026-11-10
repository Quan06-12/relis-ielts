import { toBand } from './band.js'
export const normalize = (value) => value.trim().replace(/\s+/g, ' ').toLowerCase()
export function questionsFor(test, mode) {
  return mode.sectionIndexes.flatMap((index) =>
    test.sections[index].groups.flatMap((group) =>
      group.questions.map((q) => ({ ...q, type: group.type })),
    ),
  )
}
export function grade(test, answers, mode) {
  const byId = new Map(answers.map((a) => [a.questionId, a.value]))
  const questions = questionsFor(test, mode).map((q) => {
    const actual = [...new Set((byId.get(q.id) || []).map(normalize).filter(Boolean))].sort()
    const expected = [...new Set(q.answers.map(normalize))].sort()
    const correct =
      q.type === 'multi_select'
        ? actual.length === expected.length && actual.every((v, i) => v === expected[i])
        : actual.length === 1 && expected.includes(actual[0])
    return { questionId: q.id, correct }
  })
  const correct = questions.filter((q) => q.correct).length
  const total = questions.length
  return {
    questions,
    result: {
      correct,
      total,
      band: mode.type === 'full' && total === 40 ? toBand(correct, test.skill) : null,
    },
  }
}
