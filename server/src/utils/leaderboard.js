// Weekly class leaderboard for the home page (wireframe "Bảng xếp hạng"). Pure, unit tested.
import { dayKey, attemptMinutes } from './activity.js'

const DAY_MS = 24 * 60 * 60 * 1000

// Monday ("yyyy-mm-dd") of the week that contains the date key
export function mondayKey(key) {
  const date = new Date(`${key}T00:00:00Z`)
  const daysSinceMonday = (date.getUTCDay() + 6) % 7
  return new Date(date.getTime() - daysSinceMonday * DAY_MS).toISOString().slice(0, 10)
}

// Number of submissions, minutes and average band per student, for attempts whose day is in [fromKey, toKey)
function totalsFor(students, attempts, fromKey, toKey, timeZone) {
  const totals = new Map(students.map((student) => [String(student.id), { count: 0, minutes: 0, bands: [] }]))
  for (const attempt of attempts) {
    const day = dayKey(new Date(attempt.submittedAt), timeZone)
    const total = totals.get(String(attempt.userId))
    if (!total || day < fromKey || day >= toKey) continue
    total.count += 1
    total.minutes += attemptMinutes(attempt)
    if (attempt.result?.band !== null && attempt.result?.band !== undefined) total.bands.push(attempt.result.band)
  }
  return totals
}

// More submissions first, then more minutes; same numbers share a rank (1, 2, 2, 4)
function rankByActivity(entries) {
  const sorted = [...entries].sort((a, b) => b.count - a.count || b.minutes - a.minutes)
  return sorted.map((entry, index) => {
    const previous = sorted[index - 1]
    const isTie = previous && previous.count === entry.count && previous.minutes === entry.minutes
    entry.rank = isTie ? previous.rank : index + 1
    return entry
  })
}

// Rows for this week, best first: { userId, name, count, minutes, averageBand, rank, change }.
// change: how many places up (+) or down (−) since last week; null when the student did nothing last week.
export function buildLeaderboard(students, attempts, todayKey, timeZone) {
  const thisMonday = mondayKey(todayKey)
  const lastMonday = new Date(Date.parse(`${thisMonday}T00:00:00Z`) - 7 * DAY_MS).toISOString().slice(0, 10)
  const nextMonday = new Date(Date.parse(`${thisMonday}T00:00:00Z`) + 7 * DAY_MS).toISOString().slice(0, 10)

  const thisWeek = totalsFor(students, attempts, thisMonday, nextMonday, timeZone)
  const lastWeek = totalsFor(students, attempts, lastMonday, thisMonday, timeZone)

  const lastRanks = new Map(
    rankByActivity(students.map((student) => ({ id: String(student.id), ...lastWeek.get(String(student.id)) })))
      .filter((entry) => entry.count > 0)
      .map((entry) => [entry.id, entry.rank]),
  )

  const rows = students.map((student) => {
    const total = thisWeek.get(String(student.id))
    const bands = total.bands
    return {
      userId: String(student.id),
      name: student.name,
      avatarUrl: student.avatarUrl ?? null,
      count: total.count,
      minutes: total.minutes,
      averageBand: bands.length ? Math.round((bands.reduce((sum, band) => sum + band, 0) / bands.length) * 2) / 2 : null,
    }
  })

  return rankByActivity(rows).map((row) => {
    const lastRank = lastRanks.get(row.userId)
    return { ...row, change: lastRank === undefined ? null : lastRank - row.rank }
  })
}
