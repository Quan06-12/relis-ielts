// Pure helpers for the "Thời gian học" chart on the home page. Unit tested.

// "2026-07" → "Th7"
export function monthLabel(month) {
  return `Th${Number(month.slice(5, 7))}`
}

// A rounded top for the hour axis and its 4 equal steps, e.g. 15.5 hours → 20 with ticks 0, 5, 10, 15, 20
export function hourScale(maxHours) {
  const steps = [0.25, 0.5, 1, 2, 5, 10, 20, 50]
  const step = steps.find((size) => size * 4 >= maxHours) ?? Math.ceil(maxHours / 4)
  return { top: step * 4, ticks: [0, 1, 2, 3, 4].map((index) => index * step) }
}

// 0.5 → "0,5h", 5 → "5h" (axis labels)
export function hourLabel(hours) {
  return `${String(Number(hours.toFixed(2))).replace('.', ',')}h`
}

// Time in the bar tooltip: under an hour in minutes ("45m"), otherwise hours ("7,5h", "9h")
export function shortTime(minutes) {
  if (minutes < 60) return `${minutes}m`
  return hourLabel(Math.round((minutes / 60) * 10) / 10)
}

// Total hours of all months, for the line under the chart: 47.6 → "47,6"
export function totalHoursText(months) {
  const minutes = months.reduce((sum, row) => sum + row.readingMinutes + row.listeningMinutes, 0)
  return String(Math.round((minutes / 60) * 10) / 10).replace('.', ',')
}
