import { test } from 'node:test'
import assert from 'node:assert/strict'
import { monthLabel, hourScale, hourLabel, shortTime, totalHoursText } from './studyTime.js'

test('monthLabel', () => {
  assert.equal(monthLabel('2026-07'), 'Th7')
  assert.equal(monthLabel('2026-11'), 'Th11')
})

test('hourScale rounds the top up to 4 equal steps', () => {
  assert.deepEqual(hourScale(15.5), { top: 20, ticks: [0, 5, 10, 15, 20] })
  assert.deepEqual(hourScale(0.9), { top: 1, ticks: [0, 0.25, 0.5, 0.75, 1] })
  assert.deepEqual(hourScale(0), { top: 1, ticks: [0, 0.25, 0.5, 0.75, 1] })
})

test('hourLabel and totalHoursText', () => {
  assert.equal(hourLabel(0.25), '0,25h')
  assert.equal(shortTime(45), '45m')
  assert.equal(shortTime(450), '7,5h')
  assert.equal(shortTime(540), '9h')
  assert.equal(hourLabel(5), '5h')
  assert.equal(totalHoursText([{ readingMinutes: 1500, listeningMinutes: 1356 }, { readingMinutes: 0, listeningMinutes: 0 }]), '47,6')
})
