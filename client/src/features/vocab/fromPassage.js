// "Thêm vào từ vựng" from the passage of a test: the selected words become the term and the sentence
// around them becomes the example. Pure, unit tested.

// The sentence that contains the range [start, end) of the passage, trimmed.
// A sentence ends at . ! ? or a line break; a long sentence is cut to `maxLength` characters.
export function sentenceAround(passage, start, end, maxLength = 500) {
  const isBreak = (char) => char === '.' || char === '!' || char === '?' || char === '\n'
  let from = start
  while (from > 0 && !isBreak(passage[from - 1])) from -= 1
  let to = end
  while (to < passage.length && !isBreak(passage[to])) to += 1
  if (to < passage.length && passage[to] !== '\n') to += 1 // keep the full stop
  return passage.slice(from, to).trim().slice(0, maxLength)
}

// The selected text as a vocabulary term: spaces tidied, punctuation at the edges removed
export function termFrom(text) {
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '')
}

// Words are saved only for short selections; a whole paragraph is not a vocabulary item
export const MAX_TERM_LENGTH = 80
