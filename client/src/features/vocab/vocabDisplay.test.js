import { test } from 'node:test'
import assert from 'node:assert/strict'
import { typeInfo, wordCountLabel, previewLabel, filterWords, wordForm } from './vocabDisplay.js'

test('wordCountLabel and previewLabel', () => {
  assert.equal(wordCountLabel(0), '0 words')
  assert.equal(wordCountLabel(1), '1 word')
  assert.equal(wordCountLabel(5), '5 words')
  assert.equal(previewLabel(['a', 'b']), 'a · b')
  assert.equal(previewLabel([]), 'Chưa có từ nào')
})

test('typeInfo falls back to "Khác"', () => {
  assert.equal(typeInfo('adj').label, 'Tính từ')
  assert.equal(typeInfo('zzz').label, 'Khác')
})

test('filterWords searches term, meaning and note, without accents', () => {
  const words = [
    { term: 'sustainable', meaning: 'bền vững', note: '' },
    { term: 'emission', meaning: 'khí thải', note: 'số nhiều' },
  ]
  assert.deepEqual(filterWords(words, 'SUST').map((word) => word.term), ['sustainable'])
  assert.deepEqual(filterWords(words, 'ben vung').map((word) => word.term), ['sustainable'])
  assert.deepEqual(filterWords(words, 'nhieu').map((word) => word.term), ['emission'])
  assert.equal(filterWords(words, '  ').length, 2)
})

test('wordForm starts as a noun and copies a word being edited', () => {
  assert.equal(wordForm().type, 'n')
  assert.equal(wordForm({ type: 'v', term: 'go', meaning: 'đi', verbForms: 'went' }).verbForms, 'went')
})
