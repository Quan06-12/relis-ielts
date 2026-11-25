import { test } from 'node:test'
import assert from 'node:assert/strict'
import { paintLayers, loadNotes, saveNotes, clearNotes, addRange, removeRange, overlapsAny, rangeAt, paragraphsOf, loadHighlights, saveHighlights, clearHighlights } from './highlights.js'

test('addRange merges overlapping and touching ranges and keeps them sorted', () => {
  let ranges = addRange([], { start: 10, end: 20 })
  ranges = addRange(ranges, { start: 0, end: 5 })
  ranges = addRange(ranges, { start: 18, end: 30 })
  ranges = addRange(ranges, { start: 5, end: 7 })
  assert.deepEqual(ranges, [{ start: 0, end: 7 }, { start: 10, end: 30 }])
})

test('addRange ignores an empty selection', () => {
  assert.deepEqual(addRange([{ start: 1, end: 2 }], { start: 4, end: 4 }), [{ start: 1, end: 2 }])
})

test('removeRange cuts highlights that cross its edges', () => {
  const ranges = [{ start: 0, end: 10 }, { start: 20, end: 30 }]
  assert.deepEqual(removeRange(ranges, { start: 5, end: 25 }), [{ start: 0, end: 5 }, { start: 25, end: 30 }])
  assert.deepEqual(removeRange(ranges, { start: 2, end: 4 }), [{ start: 0, end: 2 }, { start: 4, end: 10 }, { start: 20, end: 30 }])
})

test('overlapsAny and rangeAt find the highlight under a selection or a click', () => {
  const ranges = [{ start: 10, end: 20 }]
  assert.equal(overlapsAny(ranges, { start: 15, end: 40 }), true)
  assert.equal(overlapsAny(ranges, { start: 20, end: 40 }), false)
  assert.deepEqual(rangeAt(ranges, 12), { start: 10, end: 20 })
  assert.equal(rangeAt(ranges, 20), null)
})

test('paragraphsOf counts the line break between paragraphs', () => {
  assert.deepEqual(paragraphsOf('ab\ncde'), [{ text: 'ab', offset: 0 }, { text: 'cde', offset: 3 }])
})

test('highlights are saved per attempt and survive a reload', () => {
  const store = new Map()
  const storage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v), removeItem: (k) => store.delete(k) }
  saveHighlights('a1', { 0: [{ start: 1, end: 3 }] }, storage)
  assert.deepEqual(loadHighlights('a1', storage), { 0: [{ start: 1, end: 3 }] })
  assert.deepEqual(loadHighlights('other', storage), {})
  clearHighlights('a1', storage)
  assert.deepEqual(loadHighlights('a1', storage), {})
})

test('paintLayers marks highlighted pieces and the note each piece belongs to', () => {
  // "Hello world" starts at 100; highlight "llo w", note on "world"
  const pieces = paintLayers('Hello world', 100, [{ start: 102, end: 107 }], [{ start: 106, end: 111, text: 'n' }])
  assert.deepEqual(pieces, [
    { text: 'He', start: 100, marked: false, note: -1 },
    { text: 'llo ', start: 102, marked: true, note: -1 },
    { text: 'w', start: 106, marked: true, note: 0 },
    { text: 'orld', start: 107, marked: false, note: 0 },
  ])
})

test('notes are saved per attempt under their own key', () => {
  const store = new Map()
  const storage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v), removeItem: (k) => store.delete(k) }
  saveNotes('a1', { 0: [{ start: 1, end: 4, text: 'main idea' }] }, storage)
  assert.deepEqual(loadNotes('a1', storage)[0][0].text, 'main idea')
  clearNotes('a1', storage)
  assert.deepEqual(loadNotes('a1', storage), {})
})
