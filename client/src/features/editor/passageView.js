// How the editor shows a passage (or transcript) for attaching evidence (wireframe).
// Pure, unit tested. Positions are character offsets in the passage text, the same as evidence { start, end }.

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

// Paragraphs (one per non-empty line) with their place in the text: [{ start, end, text, label }]
// label is A, B, C … when withLabels is true (Reading), otherwise ''
export function paragraphRanges(text, withLabels = true) {
  const paragraphs = []
  let start = 0
  for (const line of (text ?? '').split('\n')) {
    if (line.trim() !== '') {
      paragraphs.push({ start, end: start + line.length, text: line, label: withLabels ? LETTERS[paragraphs.length] ?? '' : '' })
    }
    start += line.length + 1 // the "\n"
  }
  return paragraphs
}

// Cuts one paragraph into pieces at the edges of the evidence marks, so each piece can be underlined
// for the questions it belongs to. marks: [{ start, end, number }]
// Returns [{ start, end, text, numbers }] where numbers lists the questions whose evidence covers the piece.
export function paragraphSegments(paragraph, marks) {
  const cuts = new Set([paragraph.start, paragraph.end])
  for (const mark of marks) {
    if (mark.start > paragraph.start && mark.start < paragraph.end) cuts.add(mark.start)
    if (mark.end > paragraph.start && mark.end < paragraph.end) cuts.add(mark.end)
  }
  const points = [...cuts].sort((a, b) => a - b)

  const segments = []
  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index]
    const end = points[index + 1]
    const numbers = marks.filter((mark) => mark.start <= start && mark.end >= end).map((mark) => mark.number)
    segments.push({ start, end, text: paragraph.text.slice(start - paragraph.start, end - paragraph.start), numbers })
  }
  return segments
}

// Evidence marks of every question in a section: [{ start, end, number, key }]
export function sectionMarks(section, numbers) {
  return section.groups.flatMap((group) =>
    group.questions
      .filter((question) => question.evidence)
      .map((question) => ({ ...question.evidence, number: numbers[question.id ?? question.key], key: question.id ?? question.key })),
  )
}

// Short answer shown on a collapsed question row: "TRUE", "B, D", "10 / ten", or null when not set
export function answerSummary(question) {
  const answers = question.answers.filter((answer) => answer.trim() !== '')
  if (answers.length === 0) return null
  return answers.join(question.options.length > 0 ? ', ' : ' / ')
}

// "Rooftop gardens have only appeared…" — one line for a collapsed row
export function shortPrompt(prompt, maxLength = 60) {
  const text = (prompt ?? '').trim()
  if (text === '') return 'Chưa có nội dung'
  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 1)}…`
}
