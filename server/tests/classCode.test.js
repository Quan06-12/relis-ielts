import { test } from 'node:test'
import assert from 'node:assert/strict'
import { generateClassCode, normalizeClassCode, CODE_ALPHABET } from '../src/utils/classCode.js'

test('a class code has 6 characters from the easy-to-read alphabet', () => {
  for (let index = 0; index < 50; index += 1) {
    const code = generateClassCode()
    assert.equal(code.length, 6)
    assert.ok([...code].every((character) => CODE_ALPHABET.includes(character)))
  }
})

test('the alphabet leaves out O, 0, I and 1', () => {
  for (const character of ['O', '0', 'I', '1']) {
    assert.equal(CODE_ALPHABET.includes(character), false)
  }
})

test('a fixed random source gives a known code', () => {
  assert.equal(generateClassCode(() => 0), 'AAAAAA')
})

test('a typed code is cleaned before it is looked up', () => {
  assert.equal(normalizeClassCode(' ab3 k9z '), 'AB3K9Z')
  assert.equal(normalizeClassCode(undefined), '')
})
