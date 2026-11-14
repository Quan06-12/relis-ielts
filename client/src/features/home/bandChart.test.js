import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bandSeries, toPoints, bandToY } from './bandChart.js'

const history = [
  { id: 'c', test: { skill: 'reading' }, result: { band: 7 }, submittedAt: '2026-11-13' },
  { id: 'x', test: { skill: 'reading' }, result: { band: null }, submittedAt: '2026-11-12' }, // parts practice
  { id: 'b', test: { skill: 'listening' }, result: { band: 6.5 }, submittedAt: '2026-11-11' },
  { id: 'a', test: { skill: 'reading' }, result: { band: 6 }, submittedAt: '2026-11-10' },
]

test('series keep full tests only, oldest first, split by skill', () => {
  const series = bandSeries(history)

  assert.deepEqual(series.reading.map((item) => item.id), ['a', 'c'])
  assert.deepEqual(series.listening.map((item) => item.band), [6.5])
})

test('at most `limit` points per skill, the newest ones', () => {
  assert.deepEqual(bandSeries(history, 1).reading.map((item) => item.id), ['c'])
})

test('band 9 is at the top, band 4 and below at the bottom', () => {
  assert.equal(bandToY(9, 100), 0)
  assert.equal(bandToY(4, 100), 100)
  assert.equal(bandToY(2.5, 100), 100)
  assert.equal(bandToY(6.5, 100), 50)
})

test('points spread across the width; a single point sits in the middle', () => {
  const points = toPoints([{ band: 6 }, { band: 7 }, { band: 8 }], 200, 100)
  assert.deepEqual(points.map((point) => point.x), [0, 100, 200])
  assert.equal(toPoints([{ band: 6 }], 200, 100)[0].x, 100)
})
