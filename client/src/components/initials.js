// Two letters for an avatar without a photo: "Minhquan Pham" → "MP", "Quân" → "QU". Pure, unit tested.
export function initialsOf(name) {
  const words = String(name ?? '').trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words.at(-1)[0]).toUpperCase()
}
