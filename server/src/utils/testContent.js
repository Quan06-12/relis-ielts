// Pure helpers for the content of a test. No database here, so they are easy to unit test.

// How many sections a new test starts with, and its default time (US11, US25)
const LAYOUT = {
  reading: { full: { sections: 3, minutes: 60 }, single: { sections: 1, minutes: 20 } },
  listening: { full: { sections: 4, minutes: 40 }, single: { sections: 1, minutes: 10 } },
}

export function newTestLayout(skill, kind) {
  const layout = LAYOUT[skill][kind]
  const sections = Array.from({ length: layout.sections }, (_, index) => ({
    title: skill === 'reading' ? `Passage ${index + 1}` : `Part ${index + 1}`,
    groups: [],
  }))
  return { sections, durationMin: layout.minutes }
}

// Every question of the test in reading order, optionally only from some sections.
export function listQuestions(sections, sectionIndexes = null) {
  return sections
    .filter((_, index) => sectionIndexes === null || sectionIndexes.includes(index))
    .flatMap((section) => section.groups.flatMap((group) => group.questions))
}

// Numbers the questions 1, 2, 3... across the whole test. Returns how many there are.
export function renumberQuestions(sections) {
  const questions = listQuestions(sections)
  questions.forEach((question, index) => {
    question.number = index + 1
  })
  return questions.length
}

// Numbers of the questions that have no accepted answer yet; a test cannot be published with any (US19).
export function findQuestionsWithoutAnswer(sections) {
  return listQuestions(sections)
    .filter((question) => !question.answers.some((answer) => answer.trim() !== ''))
    .map((question) => question.number)
}

// The test as shown while someone is taking it: never contains answers, explanations,
// evidence or transcripts (otherwise they would be visible in the browser's network tab).
export function toPlayView(test) {
  return {
    id: String(test.id ?? test._id),
    title: test.title,
    skill: test.skill,
    kind: test.kind,
    durationMin: test.durationMin,
    questionCount: test.questionCount,
    sections: test.sections.map((section) => ({
      title: section.title,
      passage: section.passage,
      audioUrl: section.audioUrl,
      audioDurationSec: section.audioDurationSec,
      groups: section.groups.map((group) => ({
        type: group.type,
        instruction: group.instruction,
        questions: group.questions.map((question) => ({
          id: String(question.id ?? question._id),
          number: question.number,
          prompt: question.prompt,
          options: question.options,
        })),
      })),
    })),
  }
}

// One card in the test library
export function toSummary(test, lastBand = null) {
  return {
    id: String(test.id ?? test._id),
    title: test.title,
    skill: test.skill,
    kind: test.kind,
    status: test.status,
    coverUrl: test.coverUrl,
    durationMin: test.durationMin,
    questionCount: test.questionCount,
    updatedAt: test.updatedAt,
    lastBand,
  }
}
