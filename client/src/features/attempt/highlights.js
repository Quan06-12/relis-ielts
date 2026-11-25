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

// Splits one paragraph into pieces using two layers: highlights (merged ranges) and notes
// ({ start, end, text }, may overlap). Each piece knows whether it is highlighted and which note
// (index in `notes`) it belongs to, or -1. `offset` is where the paragraph starts in the passage.
export function paintLayers(text, offset, highlights, notes) {
  const end = offset + text.length
  const cuts = new Set([offset, end])
  for (const range of [...highlights, ...notes]) {
    if (range.start > offset && range.start < end) cuts.add(range.start)
    if (range.end > offset && range.end < end) cuts.add(range.end)
  }
  const points = [...cuts].sort((a, b) => a - b)
  const pieces = []
  for (let index = 0; index < points.length - 1; index += 1) {
    const from = points[index]
    const to = points[index + 1]
    if (to <= from) continue
    const inside = (range) => range.start <= from && range.end >= to
    pieces.push({
      text: text.slice(from - offset, to - offset),
      start: from,
      marked: highlights.some(inside),
      note: notes.findIndex(inside),
    })
  }
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

// ---- notes, saved the same way under their own key ----
const notesKeyFor = (attemptId) => `relis:notes:${attemptId}`

export function loadNotes(attemptId, storage = window.localStorage) {
  try {
    const saved = JSON.parse(storage.getItem(notesKeyFor(attemptId)) ?? '{}')
    return saved && typeof saved === 'object' ? saved : {}
  } catch {
    return {}
  }
}

export function saveNotes(attemptId, notes, storage = window.localStorage) {
  try {
    storage.setItem(notesKeyFor(attemptId), JSON.stringify(notes))
  } catch {
    // not saved this time
  }
}

export function clearNotes(attemptId, storage = window.localStorage) {
  try {
    storage.removeItem(notesKeyFor(attemptId))
  } catch {
    // nothing to clear
  }
}
