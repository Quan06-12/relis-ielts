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
  // Nothing was answered: say so instead of "0/40", it does not count towards any band
  if (result.answered === 0) return 'Bài trống'
  if (result.band !== null && result.band !== undefined) return `Band ${result.band.toFixed(1)}`
  return `${result.correct}/${result.total} câu đúng`
}

// "Reading · Full test", "Listening · Part 3", "Reading · Passage 1, 2" for the label on a card
export function modeLabel(attempt) {
  const skill = attempt.test?.skill === 'listening' ? 'Listening' : 'Reading'
  if (attempt.mode?.type === 'full') return `${skill} · Full test`
  const word = skill === 'Listening' ? 'Part' : 'Passage'
  const numbers = (attempt.mode?.sectionIndexes ?? []).map((index) => index + 1)
  return numbers.length ? `${skill} · ${word} ${numbers.join(', ')}` : skill
}

// "Hôm nay · 20:14", "Hôm qua · 08:40", "26/10/2026 · 22:10"
export function whenLabel(date, now = new Date()) {
  const moment = new Date(date)
  const pad = (number) => String(number).padStart(2, '0')
  const time = `${pad(moment.getHours())}:${pad(moment.getMinutes())}`
  const dayStart = (value) => new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime()
  const daysAgo = Math.round((dayStart(now) - dayStart(moment)) / (24 * 60 * 60 * 1000))
  if (daysAgo === 0) return `Hôm nay · ${time}`
  if (daysAgo === 1) return `Hôm qua · ${time}`
  return `${pad(moment.getDate())}/${pad(moment.getMonth() + 1)}/${moment.getFullYear()} · ${time}`
}

// Numbers at the top of the page, from submitted attempts and the activity days of the same period:
// { count, minutes, reading: { band, tests }, listening: { band, tests } }; band is the mean of full-test bands
export function historyStats(attempts, days) {
  const averageFor = (skill) => {
    const bands = attempts
      .filter((attempt) => attempt.test?.skill === skill && attempt.result?.band !== null && attempt.result?.band !== undefined)
      .map((attempt) => attempt.result.band)
    const band = bands.length ? Math.round((bands.reduce((sum, value) => sum + value, 0) / bands.length) * 2) / 2 : null
    return { band, tests: bands.length }
  }
  return {
    count: days.reduce((sum, day) => sum + day.reading + day.listening, 0),
    minutes: days.reduce((sum, day) => sum + day.minutes, 0),
    reading: averageFor('reading'),
    listening: averageFor('listening'),
  }
}

// "3 giờ 49 phút", "45 phút"
export function durationLabel(minutes) {
  if (minutes < 60) return `${minutes} phút`
  const rest = minutes % 60
  return rest === 0 ? `${Math.floor(minutes / 60)} giờ` : `${Math.floor(minutes / 60)} giờ ${rest} phút`
}
