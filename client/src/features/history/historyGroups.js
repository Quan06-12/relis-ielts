// Groups history cards into "This week / Last week / Earlier" (US39). Pure, unit tested.
// Weeks start on Monday, like a Vietnamese calendar.

export function startOfWeek(date) {
  const day = new Date(date)
  day.setHours(0, 0, 0, 0)
  const daysSinceMonday = (day.getDay() + 6) % 7 // Sunday = 6, Monday = 0
  day.setDate(day.getDate() - daysSinceMonday)
  return day
}

export function groupByWeek(attempts, now = new Date()) {
  const thisWeek = startOfWeek(now)
  const lastWeek = new Date(thisWeek)
  lastWeek.setDate(lastWeek.getDate() - 7)

  const groups = [
    { label: 'Tuần này', items: [] },
    { label: 'Tuần trước', items: [] },
    { label: 'Trước đó', items: [] },
  ]
  for (const attempt of attempts) {
    const startedAt = new Date(attempt.startedAt)
    if (startedAt >= thisWeek) groups[0].items.push(attempt)
    else if (startedAt >= lastWeek) groups[1].items.push(attempt)
    else groups[2].items.push(attempt)
  }
  return groups.filter((group) => group.items.length > 0)
}

// The score on a history card: band for a full test, otherwise "correct/total"
export function scoreLabel(result) {
  if (!result) return null
  if (result.band !== null && result.band !== undefined) return `Band ${result.band.toFixed(1)}`
  return `${result.correct}/${result.total} câu đúng`
}
