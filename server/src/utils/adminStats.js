import { dayKey } from './activity.js'

const DAY_MS = 24 * 60 * 60 * 1000

// The last `days` calendar days (oldest first) with how many users joined and attempts were handed in
// on each, as seen in the given time zone. Pure, so it has a unit test.
export function dailySeries(users, attempts, today, days = 30, timeZone = 'Asia/Ho_Chi_Minh') {
  const keys = []
  for (let back = days - 1; back >= 0; back -= 1) keys.push(dayKey(new Date(today.getTime() - back * DAY_MS), timeZone))
  const rows = new Map(keys.map((date) => [date, { date, newUsers: 0, attempts: 0 }]))
  for (const user of users) {
    const row = rows.get(dayKey(user.createdAt, timeZone))
    if (row) row.newUsers += 1
  }
  for (const attempt of attempts) {
    const row = rows.get(dayKey(attempt.submittedAt, timeZone))
    if (row) row.attempts += 1
  }
  return keys.map((date) => rows.get(date))
}
