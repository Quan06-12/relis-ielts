// The wall of IELTS test cards on the landing page. Pure, unit tested.

// Made-up practice topics in the style of IELTS passages and parts; scene picks the drawing.
export const SAMPLE_TESTS = [
  { skill: 'reading', part: 'Passage 1', title: 'Gardens on the Rooftops', scene: 'rooftop' },
  { skill: 'listening', part: 'Part 2', title: 'A Guide to the Harbour Lighthouse', scene: 'lighthouse' },
  { skill: 'reading', part: 'Passage 2', title: 'The Secret Life of Urban Bees', scene: 'bees' },
  { skill: 'listening', part: 'Part 1', title: 'Booking a Cycling Holiday', scene: 'mountains' },
  { skill: 'reading', part: 'Passage 3', title: 'Can Oceans Store Our Carbon?', scene: 'ocean' },
  { skill: 'listening', part: 'Part 3', title: 'A Group Project on Recycling', scene: 'recycling' },
  { skill: 'reading', part: 'Passage 2', title: 'Night Skies and Light Pollution', scene: 'night' },
  { skill: 'listening', part: 'Part 4', title: 'The History of Paper Money', scene: 'coins' },
  { skill: 'reading', part: 'Passage 1', title: 'Desert Plants That Drink Fog', scene: 'desert' },
  { skill: 'listening', part: 'Part 1', title: 'A Day at the Modern Art Gallery', scene: 'art' },
]

// A grid of cards, columns × rows. Each column starts at a different test so neighbours never repeat.
// Every card: { key, row, column, test }
export function wallCards(columns, rows, tests = SAMPLE_TESTS) {
  const cards = []
  for (let column = 0; column < columns; column += 1) {
    for (let row = 0; row < rows; row += 1) {
      cards.push({ key: `${column}-${row}`, row, column, test: tests[(column * 3 + row) % tests.length] })
    }
  }
  return cards
}
