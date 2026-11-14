// US18: turning a text selection in the passage or transcript into a question's evidence.
// Pure functions, unit tested. Evidence is a character range { start, end } in that text.

// The selected range without spaces or line breaks at its ends; null when nothing real is selected
export function evidenceFromSelection(text, start, end) {
  if (typeof start !== 'number' || typeof end !== 'number' || start >= end) return null
  let from = start
  let to = end
  while (from < to && /\s/.test(text[from])) from += 1
  while (to > from && /\s/.test(text[to - 1])) to -= 1
  return from < to ? { start: from, end: to } : null
}

// The evidence text to show under the question, shortened in the middle when long
export function evidenceSnippet(text, evidence, maxLength = 160) {
  if (!evidence || !text) return ''
  const snippet = text.slice(evidence.start, evidence.end)
  if (snippet.length <= maxLength) return snippet
  const half = Math.floor((maxLength - 1) / 2)
  return `${snippet.slice(0, half)}…${snippet.slice(-half)}`
}

// True when the stored range no longer fits the text (the passage was shortened after attaching)
export function isEvidenceOutOfRange(text, evidence) {
  return Boolean(evidence) && evidence.end > (text ?? '').length
}
