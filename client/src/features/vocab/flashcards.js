// Flashcard review of a vocabulary set. Pure, unit tested.

// A copy of the list in random order (Fisher–Yates); `random` is passed in by tests
export function shuffled(list, random = Math.random) {
  const copy = [...list]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1))
    ;[copy[index], copy[other]] = [copy[other], copy[index]]
  }
  return copy
}

// Summary at the end of a round. results: { [wordId]: 'known' | 'again' }
export function roundSummary(cards, results) {
  const again = cards.filter((card) => results[card.id] === 'again')
  return { known: cards.length - again.length, total: cards.length, again }
}
