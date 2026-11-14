import { test } from 'node:test'
import assert from 'node:assert/strict'
import { paragraphRanges, paragraphSegments, sectionMarks, answerSummary, shortPrompt } from './passageView.js'

test('paragraphRanges skips empty lines and keeps the offsets of the full text', () => {
  const text = 'First para.\n\nSecond para.'
  const paragraphs = paragraphRanges(text)
  assert.deepEqual(paragraphs.map((p) => [p.label, p.start, p.end]), [['A', 0, 11], ['B', 13, 25]])
  assert.equal(text.slice(paragraphs[1].start, paragraphs[1].end), 'Second para.')
  assert.equal(paragraphRanges(text, false)[0].label, '')
})

test('paragraphSegments cuts at evidence edges and lists the questions per piece', () => {
  const paragraph = { start: 10, end: 30, text: 'abcdefghijklmnopqrst' }
  const segments = paragraphSegments(paragraph, [{ start: 12, end: 16, number: 1 }, { start: 14, end: 40, number: 2 }])
  assert.deepEqual(
    segments.map((s) => [s.text, s.numbers]),
    [['ab', []], ['cd', [1]], ['ef', [1, 2]], ['ghijklmnopqrst', [2]]],
  )
})

test('sectionMarks gives every attached evidence its question number', () => {
  const section = { groups: [{ questions: [{ id: 'q1', evidence: { start: 0, end: 5 } }, { id: 'q2', evidence: null }] }] }
  assert.deepEqual(sectionMarks(section, { q1: 4, q2: 5 }), [{ start: 0, end: 5, number: 4, key: 'q1' }])
})

test('answerSummary and shortPrompt', () => {
  assert.equal(answerSummary({ answers: ['TRUE'], options: ['TRUE', 'FALSE'] }), 'TRUE')
  assert.equal(answerSummary({ answers: ['B', 'D'], options: ['A', 'B', 'C', 'D'] }), 'B, D')
  assert.equal(answerSummary({ answers: ['10', 'ten'], options: [] }), '10 / ten')
  assert.equal(answerSummary({ answers: [' '], options: [] }), null)
  assert.equal(shortPrompt(''), 'Chưa có nội dung')
  assert.equal(shortPrompt('a'.repeat(70), 10), 'aaaaaaaaa…')
})
