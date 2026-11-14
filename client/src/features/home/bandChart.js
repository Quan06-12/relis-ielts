// US42: data and coordinates for the band-over-time chart on the home page. Pure, unit tested.

export const BAND_MIN = 4
export const BAND_MAX = 9

// Full-test bands per skill, oldest first, at most `limit` per skill.
// attempts: history items (newest first, as GET /attempts returns them)
export function bandSeries(attempts, limit = 10) {
  const series = { reading: [], listening: [] }
  for (const attempt of attempts) {
    const skill = attempt.test?.skill
    const band = attempt.result?.band
    if (series[skill] && band !== null && band !== undefined && series[skill].length < limit) {
      series[skill].push({ id: attempt.id, band, date: attempt.submittedAt })
    }
  }
  return { reading: series.reading.reverse(), listening: series.listening.reverse() }
}

// Turns one series into points inside a width × height box. Bands below 4 sit on the bottom line.
export function toPoints(series, width, height) {
  if (series.length === 0) return []
  const step = series.length === 1 ? 0 : width / (series.length - 1)
  return series.map((item, index) => ({
    ...item,
    x: series.length === 1 ? width / 2 : index * step,
    y: bandToY(item.band, height),
  }))
}

export function bandToY(band, height) {
  const clamped = Math.min(BAND_MAX, Math.max(BAND_MIN, band))
  return height - ((clamped - BAND_MIN) / (BAND_MAX - BAND_MIN)) * height
}
