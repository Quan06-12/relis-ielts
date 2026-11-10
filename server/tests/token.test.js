import { test } from 'node:test'
import assert from 'node:assert/strict'
import jwt from 'jsonwebtoken'
import { createToken, readUserIdFromToken } from '../src/utils/token.js'

process.env.JWT_SECRET = 'test-secret'

test('a token we created gives back the same user id', () => {
  assert.equal(readUserIdFromToken(createToken('6730a1f2c4e5d6b7a8091234')), '6730a1f2c4e5d6b7a8091234')
})

test('a token signed with another secret is rejected', () => {
  const forged = jwt.sign({ userId: 'x' }, 'other-secret')
  assert.equal(readUserIdFromToken(forged), null)
})

test('an expired token is rejected', () => {
  const expired = jwt.sign({ userId: 'x' }, 'test-secret', { expiresIn: -10 })
  assert.equal(readUserIdFromToken(expired), null)
})
