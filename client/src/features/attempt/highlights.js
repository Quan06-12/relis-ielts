// US43: highlights in the passage while taking a test.
// A highlight is a character range { start, end } in the section's passage text (end not included).
// Ranges are kept sorted and never overlap, so painting them is a single pass.

// Adds a range, merging it with any range it touches or overlaps
export function addRange(ranges, range) {
  if (!(range.end > range.start)) return ranges
  let { start, end } = range
  const kept = []
  for (const current of ranges) {
    if (current.end < start || current.start > end) kept.push(current)
    else {
      start = Math.min(start, current.start)
      end = Math.max(end, current.end)
    }
  }
  return [...kept, { start, end }].sort((a, b) => a.start - b.start)
}

// Removes a range: highlights inside it disappear, highlights crossing its edges are cut
export function removeRange(ranges, range) {
  const result = []
  for (const current of ranges) {
    if (current.end <= range.start || current.start >= range.end) {
      result.push(current)
      continue
    }
    if (current.start < range.start) result.push({ start: current.start, end: range.start })
    if (current.end > range.end) result.push({ start: range.end, end: current.end })
  }
  return result
}

// True when the range touches at least one highlight (then "Bỏ tô sáng" is offered)
export function overlapsAny(ranges, range) {
  return ranges.some((current) => current.start < range.end && current.end > range.start)
}

// The highlight that contains a character position, or null
export function rangeAt(ranges, position) {
  return ranges.find((current) => current.start <= position && position < current.end) ?? null
}

// Splits one paragraph into plain and highlighted pieces.
// `offset` is where the paragraph starts in the whole passage; each piece keeps its own start.
export function paintParagraph(text, offset, ranges) {
  const pieces = []
  let position = offset
  const end = offset + text.length
  for (const range of ranges) {
    if (range.end <= position || range.start >= end) continue
    const from = Math.max(range.start, position)
    const to = Math.min(range.end, end)
    if (from > position) pieces.push({ text: text.slice(position - offset, from - offset), start: position, marked: false })
    pieces.push({ text: text.slice(from - offset, to - offset), start: from, marked: true })
    position = to
  }
  if (position < end) pieces.push({ text: text.slice(position - offset), start: position, marked: false })
  return pieces
}

// Paragraphs of a passage with the position where each one starts ("\n" counts as one character)
export function paragraphsOf(passage) {
  let offset = 0
  return passage.split('\n').map((text) => {
    const paragraph = { text, offset }
    offset += text.length + 1
    return paragraph
  })
}

// ---- saved in the browser per attempt, so a reload keeps them ----
// { [sectionKey]: [{ start, end }] }; localStorage can throw, so a failure just means no saving.

const keyFor = (attemptId) => `relis:highlights:${attemptId}`

export function loadHighlights(attemptId, storage = window.localStorage) {
  try {
    const saved = JSON.parse(storage.getItem(keyFor(attemptId)) ?? '{}')
    return saved && typeof saved === 'object' ? saved : {}
  } catch {
    return {}
  }
}

export function saveHighlights(attemptId, highlights, storage = window.localStorage) {
  try {
    storage.setItem(keyFor(attemptId), JSON.stringify(highlights))
  } catch {
    // not saved this time
  }
}

export function clearHighlights(attemptId, storage = window.localStorage) {
  try {
    storage.removeItem(keyFor(attemptId))
  } catch {
    // nothing to clear
  }
}
