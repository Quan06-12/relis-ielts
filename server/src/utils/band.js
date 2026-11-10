// Source: docs/sprint-1-guide.md. The document has no mapping for 0..3.
const table = [
  [39, 9, 9],
  [37, 8.5, 8.5],
  [35, 8, 8],
  [33, 7.5, 7.5],
  [32, 7.5, 7],
  [30, 7, 7],
  [27, 6.5, 6.5],
  [26, 6.5, 6],
  [23, 6, 6],
  [19, 5.5, 5.5],
  [18, 5.5, 5],
  [16, 5, 5],
  [15, 4.5, 5],
  [13, 4.5, 4.5],
  [10, 4, 4],
  [8, 3.5, 3.5],
  [6, 3, 3],
  [4, 2.5, 2.5],
]
export function toBand(score, skill) {
  if (
    !Number.isInteger(score) ||
    score < 0 ||
    score > 40 ||
    !['reading', 'listening'].includes(skill)
  )
    return null
  return table.find(([min]) => score >= min)?.[skill === 'listening' ? 1 : 2] ?? null
}
export function overallBand(reading, listening) {
  return reading == null || listening == null
    ? null
    : Math.round(((reading + listening) / 2) * 2) / 2
}
