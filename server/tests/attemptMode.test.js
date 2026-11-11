import { test } from 'node:test'
import assert from 'node:assert/strict'
import { checkMode } from '../src/utils/attemptMode.js'

const threePassages = { sections: [{}, {}, {}] }

function fieldsOf(fn) {
  try {
    fn()
    return []
  } catch (error) {
    return error.details.map((detail) => detail.field)
  }
}

test('a full attempt with every section is accepted', () => {
  assert.deepEqual(checkMode({ type: 'full', sectionIndexes: [2, 0, 1], timeLimitMin: 60 }, threePassages), {
    type: 'full',
    sectionIndexes: [0, 1, 2],
    timeLimitMin: 60,
  })
})

test('practising one passage is accepted', () => {
  const mode = checkMode({ type: 'parts', sectionIndexes: [1], timeLimitMin: 20 }, threePassages)
  assert.deepEqual(mode.sectionIndexes, [1])
})

test('a full attempt that skips a section is rejected', () => {
  assert.deepEqual(fieldsOf(() => checkMode({ type: 'full', sectionIndexes: [0, 1], timeLimitMin: 60 }, threePassages)), [
    'mode.sectionIndexes',
  ])
})

test('a section that does not exist is rejected', () => {
  assert.deepEqual(fieldsOf(() => checkMode({ type: 'parts', sectionIndexes: [5], timeLimitMin: 20 }, threePassages)), [
    'mode.sectionIndexes',
  ])
})

test('time limit must be 1 to 180 whole minutes', () => {
  assert.deepEqual(fieldsOf(() => checkMode({ type: 'parts', sectionIndexes: [0], timeLimitMin: 0 }, threePassages)), [
    'mode.timeLimitMin',
  ])
  assert.deepEqual(fieldsOf(() => checkMode({ type: 'parts', sectionIndexes: [0], timeLimitMin: 2.5 }, threePassages)), [
    'mode.timeLimitMin',
  ])
})
