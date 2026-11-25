// The "today" part of the home page: which system tests to suggest and the practice streak strip.
// Pure, unit tested.
import { toKey } from './activityCalendar.js'

// Up to `count` tests the user has not done yet, mixing Reading and Listening and putting short
// single tests before full tests (a quick first win). `tests` are library summaries.
export function pickSuggestions(tests, count = 3) {
  const byPreference = [...tests].sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'single' ? -1 : 1))
  const picked = []
  for (const skill of ['reading', 'listening']) {
    const first = byPreference.find((test) => test.skill === skill)
    if (first) picked.push(first)
  }
  for (const test of byPreference) {
    if (picked.length >= count) break
    if (!picked.includes(test)) picked.push(test)
  }
  return picked.slice(0, count)
}

const WEEKDAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

// The last `count` days ending today, oldest first, each marked active when something was submitted.
// days: [{ date: 'yyyy-mm-dd', reading, listening, minutes }] from GET /attempts/activity
export function streakDays(days, today = new Date(), count = 14) {
  const byDate = new Map(days.map((day) => [day.date, day]))
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today)
    date.setDate(date.getDate() - (count - 1 - index))
    const key = toKey(date)
    const day = byDate.get(key)
    const submissions = day ? (day.reading ?? 0) + (day.listening ?? 0) : 0
    return { key, weekday: WEEKDAY_SHORT[date.getDay()], dayOfMonth: date.getDate(), active: submissions > 0, submissions, isToday: index === count - 1 }
  })
}

// Submissions and minutes over the last 7 days, for the line under the strip
export function lastWeekTotals(days, today = new Date()) {
  const week = streakDays(days, today, 7).map((day) => day.key)
  const inWeek = days.filter((day) => week.includes(day.date))
  return {
    submissions: inWeek.reduce((sum, day) => sum + (day.reading ?? 0) + (day.listening ?? 0), 0),
    minutes: inWeek.reduce((sum, day) => sum + (day.minutes ?? 0), 0),
  }
}
