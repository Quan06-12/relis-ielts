// Numbers for the home page (US46). Pure, unit tested.

// Whole days from today until the exam; null when no date is set. 0 = the exam is today.
export function daysUntil(examDate, now = new Date()) {
  if (!examDate) return null
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const exam = new Date(examDate)
  exam.setHours(0, 0, 0, 0)
  return Math.round((exam - today) / (24 * 60 * 60 * 1000))
}

// Latest full-test band for each skill, from history items (newest first): { reading, listening }
export function latestBands(attempts) {
  const bands = { reading: null, listening: null }
  for (const attempt of attempts) {
    const skill = attempt.test?.skill
    const band = attempt.result?.band
    if (skill && band !== null && band !== undefined && bands[skill] === null) {
      bands[skill] = band
    }
  }
  return bands
}

// How far the latest band is from the goal: "+0.5", "−1.0", "đạt mục tiêu", or null when one of them is missing
export function gapLabel(band, goal) {
  if (band === null || goal === null || goal === undefined) return null
  const gap = goal - band
  if (gap <= 0) return 'đạt mục tiêu'
  return `còn ${gap.toFixed(1)}`
}

// Band choices for the goal selects: 4.0 … 9.0
export const BAND_CHOICES = Array.from({ length: 11 }, (_, index) => 4 + index * 0.5)
