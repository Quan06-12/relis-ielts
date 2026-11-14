// Finds where a quoted sentence sits in a passage, as an evidence range { start, end } (US18).
// Used by the demo data script so evidence never has to be counted by hand.
export function findEvidence(text, quote) {
  const start = text.indexOf(quote)
  if (start === -1) {
    throw new Error(`Evidence not found in the passage: "${quote.slice(0, 40)}…"`)
  }
  return { start, end: start + quote.length }
}
