// Some passages start with a copy of the section title on their first line (an early version of the
// demo data did this), so the title appears twice when the test is taken. This removes that first line
// and moves the evidence ranges back by the same number of characters, so highlights still match.

// Returns the fixed section, or null when its passage does not start with the title
export function withoutRepeatedTitle(section) {
  const title = (section.title ?? '').trim()
  const passage = section.passage ?? ''
  if (title === '') return null
  const firstBreak = passage.indexOf('\n')
  const firstLine = firstBreak === -1 ? passage : passage.slice(0, firstBreak)
  if (firstLine.trim() !== title) return null

  // Remove the title line and the empty lines after it
  const rest = passage.slice(firstLine.length).replace(/^\n+/, '')
  const removed = passage.length - rest.length

  return {
    ...section,
    passage: rest,
    groups: section.groups.map((group) => ({
      ...group,
      questions: group.questions.map((question) =>
        question.evidence && question.evidence.start >= removed
          ? { ...question, evidence: { start: question.evidence.start - removed, end: question.evidence.end - removed } }
          : question
      ),
    })),
  }
}
