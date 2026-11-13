// Small pure helpers for the review page, unit tested.

// Cuts a passage or transcript around the evidence of one question (US37):
// { before, marked, after }, or null when the question has no usable evidence.
export function splitByEvidence(text, evidence) {
  if (!evidence || !text) return null
  const start = Math.max(0, evidence.start)
  const end = Math.min(text.length, evidence.end)
  if (start >= end) return null
  return { before: text.slice(0, start), marked: text.slice(start, end), after: text.slice(end) }
}

// 'correct' | 'wrong' | 'blank' for one answer after scoring
export function answerStatus(answer) {
  const isEmpty = !answer || answer.value.every((item) => item.trim() === '')
  if (isEmpty) return 'blank'
  return answer.correct ? 'correct' : 'wrong'
}

// Time between start and submit: "42 phút 05 giây"
export function formatDuration(startedAt, submittedAt) {
  const totalSeconds = Math.max(0, Math.round((new Date(submittedAt) - new Date(startedAt)) / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes} phút ${String(seconds).padStart(2, '0')} giây`
}

// What the user wrote, for display: "B, D" or "(bỏ trống)"
export function formatValue(value) {
  const parts = (value ?? []).filter((item) => item.trim() !== '')
  return parts.length > 0 ? parts.join(', ') : '(bỏ trống)'
}
