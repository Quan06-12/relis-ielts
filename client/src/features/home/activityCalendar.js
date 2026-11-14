// Dates for the "Biểu đồ chăm chỉ" calendar and the weekly table on the home page. Pure, unit tested.
// Dates are handled as "yyyy-mm-dd" strings in the viewer's local time, the same keys the server sends.

const pad = (number) => String(number).padStart(2, '0')

// "2026-11-14" for a local Date
export function toKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

// Local Date at midnight for a key
export function fromKey(key) {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function addDays(date, count) {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + count)
  return copy
}

// Monday of the week that contains the date (weeks start on Monday in Vietnam: T2 … CN)
function mondayOf(date) {
  const day = (date.getDay() + 6) % 7 // Monday 0 … Sunday 6
  return addDays(date, -day)
}

// The 7 keys of the week (Monday → Sunday) that contains the key
export function weekOf(key) {
  const monday = mondayOf(fromKey(key))
  return Array.from({ length: 7 }, (_, index) => toKey(addDays(monday, index)))
}

// Weeks shown for a month (month is 0–11): every Monday-to-Sunday week that touches it.
// Each cell: { key, day, inMonth }
export function monthGrid(year, month) {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const weeks = []
  for (let monday = mondayOf(first); monday <= last; monday = addDays(monday, 7)) {
    weeks.push(
      Array.from({ length: 7 }, (_, index) => {
        const date = addDays(monday, index)
        return { key: toKey(date), day: date.getDate(), inMonth: date.getMonth() === month }
      }),
    )
  }
  return weeks
}

// "33m", "1h05m", "0m"
export function formatMinutes(minutes) {
  if (minutes < 60) return `${minutes}m`
  return `${Math.floor(minutes / 60)}h${pad(minutes % 60)}m`
}

// How dark a day looks in "Thời gian học" mode: 0 = nothing, 1 = under 30 min, 2 = under an hour, 3 = an hour or more
export function timeLevel(minutes) {
  if (!minutes) return 0
  if (minutes < 30) return 1
  if (minutes < 60) return 2
  return 3
}

// Days of the month (month is 0–11) that have at least one submission
export function activeDaysInMonth(days, year, month) {
  const prefix = `${year}-${pad(month + 1)}-`
  return days.filter((row) => row.date.startsWith(prefix) && row.reading + row.listening > 0).length
}

// The 7 rows of the weekly table and their total, from the server rows (missing days count as 0)
export function weekRows(days, key) {
  const byDate = new Map(days.map((row) => [row.date, row]))
  const rows = weekOf(key).map((date) => byDate.get(date) ?? { date, reading: 0, listening: 0, minutes: 0 })
  const total = rows.reduce(
    (sum, row) => ({ reading: sum.reading + row.reading, listening: sum.listening + row.listening, minutes: sum.minutes + row.minutes }),
    { reading: 0, listening: 0, minutes: 0 },
  )
  return { rows, total }
}

// "14/11/2026" from a key
export function displayDate(key) {
  const [year, month, day] = key.split('-')
  return `${day}/${month}/${year}`
}
