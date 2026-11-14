// Study activity for the home page calendar ("Biểu đồ chăm chỉ") and the weekly table. Pure, unit tested.

const DAY_MS = 24 * 60 * 60 * 1000
// A test left open overnight would count as hours of study; one attempt never counts for more than this
const MAX_MINUTES_PER_ATTEMPT = 180

// "2026-11-14" for a moment, as seen in the given time zone (en-CA formats dates as yyyy-mm-dd)
export function dayKey(date, timeZone) {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}

// A time zone name the server understands, or the app's default
export function safeTimeZone(name, fallback = 'Asia/Ho_Chi_Minh') {
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone: name })
    return name
  } catch {
    return fallback
  }
}

// Minutes spent on one submitted attempt, from start to submit, capped by its time limit
export function attemptMinutes(attempt) {
  const minutes = Math.round((new Date(attempt.submittedAt) - new Date(attempt.startedAt)) / 60000)
  const cap = Math.min(attempt.mode?.timeLimitMin ?? MAX_MINUTES_PER_ATTEMPT, MAX_MINUTES_PER_ATTEMPT)
  return Math.max(0, Math.min(minutes, cap))
}

// One row per day that has submissions: [{ date, reading, listening, minutes }], oldest first.
// skillByTestId: Map of test id → 'reading' | 'listening'
export function activityByDay(attempts, skillByTestId, timeZone) {
  const byDate = new Map()
  for (const attempt of attempts) {
    const date = dayKey(new Date(attempt.submittedAt), timeZone)
    const row = byDate.get(date) ?? { date, reading: 0, listening: 0, minutes: 0 }
    const skill = skillByTestId.get(String(attempt.testId))
    if (skill === 'reading' || skill === 'listening') row[skill] += 1
    row.minutes += attemptMinutes(attempt)
    byDate.set(date, row)
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date))
}

// Days in a row with at least one submission, ending today, or yesterday if nothing is done yet today
export function currentStreak(activeDates, today) {
  const active = new Set(activeDates)
  const previousDay = (date) => new Date(Date.parse(`${date}T00:00:00Z`) - DAY_MS).toISOString().slice(0, 10)

  let day = active.has(today) ? today : previousDay(today)
  let streak = 0
  while (active.has(day)) {
    streak += 1
    day = previousDay(day)
  }
  return streak
}
