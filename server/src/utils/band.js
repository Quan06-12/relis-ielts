// Number of correct answers (out of 40) → IELTS band.
// Common reference tables for Listening and Academic Reading; see docs/sprint-1-guide.md.
// Each row means "from this many correct answers upwards".

const LISTENING = [
  [39, 9], [37, 8.5], [35, 8], [32, 7.5], [30, 7], [26, 6.5], [23, 6],
  [18, 5.5], [16, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5],
]

const READING = [
  [39, 9], [37, 8.5], [35, 8], [33, 7.5], [30, 7], [27, 6.5], [23, 6],
  [19, 5.5], [15, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5],
]

export function bandFromCorrect(skill, correct) {
  const table = skill === 'listening' ? LISTENING : READING
  const row = table.find(([minimum]) => correct >= minimum)
  return row ? row[1] : 0 // fewer than 4 correct answers is below the table
}
