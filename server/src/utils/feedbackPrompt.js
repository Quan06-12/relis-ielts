// AI feedback on a submitted attempt (US49). Pure functions, unit tested:
// what we send to Gemini and how we read its answer. The Gemini call itself is in services/aiFeedback.js.

export const QUESTION_TYPE_NAMES = {
  tfng: 'True/False/Not Given',
  ynng: 'Yes/No/Not Given',
  mcq: 'Multiple choice (one answer)',
  multi_select: 'Multiple choice (several answers)',
  matching: 'Matching',
  completion: 'Sentence/summary completion',
  short_answer: 'Short answer',
}

// Correct answers per question type, for the sections that were taken: [{ type, correct, total }]
export function accuracyByType(test, answers, sectionIndexes) {
  const correctById = new Map(answers.map((answer) => [String(answer.questionId), answer.correct === true]))
  const byType = new Map()

  test.sections.forEach((section, index) => {
    if (!sectionIndexes.includes(index)) return
    for (const group of section.groups) {
      const row = byType.get(group.type) ?? { type: group.type, correct: 0, total: 0 }
      for (const question of group.questions) {
        row.total += 1
        if (correctById.get(String(question._id ?? question.id))) row.correct += 1
      }
      byType.set(group.type, row)
    }
  })

  return [...byType.values()]
}

// The prompt: only numbers and question types, never the passage or the user's name
export function buildFeedbackPrompt({ skill, result, byType }) {
  const lines = byType.map((row) => `- ${QUESTION_TYPE_NAMES[row.type] ?? row.type}: ${row.correct}/${row.total} correct`)

  return [
    `You are an IELTS ${skill} teacher. A student just finished a practice test.`,
    `Score: ${result.correct}/${result.total} correct${result.band !== null ? `, band ${result.band}` : ''}.`,
    'Results by question type:',
    ...lines,
    '',
    'Write short, encouraging feedback in Vietnamese.',
    'Reply with JSON only, in this shape:',
    '{"summary": "2-3 sentences about the result", "weakTypes": ["question type names from the list above with the lowest accuracy, at most 2"], "tips": ["concrete practice tips, at most 3"]}',
  ].join('\n')
}

// Reads Gemini's reply. Returns { summary, weakTypes, tips } or throws when it is not usable.
export function parseFeedback(text) {
  // Gemini sometimes wraps JSON in ```json fences even when asked not to
  const json = String(text ?? '').replace(/^\s*```(?:json)?/i, '').replace(/```\s*$/, '').trim()
  const data = JSON.parse(json)

  const asTextList = (value, limit) =>
    (Array.isArray(value) ? value : []).filter((item) => typeof item === 'string' && item.trim() !== '').slice(0, limit)

  if (typeof data.summary !== 'string' || data.summary.trim() === '') {
    throw new Error('The AI reply has no summary')
  }

  return { summary: data.summary.trim(), weakTypes: asTextList(data.weakTypes, 2), tips: asTextList(data.tips, 3) }
}
