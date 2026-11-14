import { test } from 'node:test'
import assert from 'node:assert/strict'
import { backupPending, loadPending, clearPending } from './pendingBackup.js'

// Minimal stand-in for localStorage
function fakeStorage() {
  const data = new Map()
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
  }
}

test('pending answers survive a reload until they are cleared', () => {
  const storage = fakeStorage()

  backupPending('a1', { q1: ['TRUE'] }, storage)
  assert.deepEqual(loadPending('a1', storage), { q1: ['TRUE'] })

  clearPending('a1', storage)
  assert.deepEqual(loadPending('a1', storage), {})
})

test('each attempt has its own backup', () => {
  const storage = fakeStorage()
  backupPending('a1', { q1: ['A'] }, storage)

  assert.deepEqual(loadPending('a2', storage), {})
})

test('a broken or blocked storage never breaks the page', () => {
  const broken = {
    getItem: () => '{not json',
    setItem: () => {
      throw new Error('blocked')
    },
    removeItem: () => {},
  }

  assert.doesNotThrow(() => backupPending('a1', { q1: ['A'] }, broken))
  assert.deepEqual(loadPending('a1', broken), {})
})
