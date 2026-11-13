import { test } from 'node:test'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'
import { toErrorResponse } from '../src/middleware/errorHandler.js'
import { AppError } from '../src/errors/AppError.js'

test('AppError keeps its status, code and details', () => {
  const error = new AppError(409, 'ATTEMPT_IN_PROGRESS', 'Already started', { attemptId: 'abc' })

  assert.deepEqual(toErrorResponse(error), {
    status: 409,
    body: { error: { code: 'ATTEMPT_IN_PROGRESS', message: 'Already started', details: { attemptId: 'abc' } } },
  })
})

test('mongoose validation error lists each invalid field', () => {
  const error = new mongoose.Error.ValidationError()
  error.addError('title', new mongoose.Error.ValidatorError({ path: 'title', message: 'Title is required' }))

  const { status, body } = toErrorResponse(error)

  assert.equal(status, 400)
  assert.equal(body.error.code, 'VALIDATION_ERROR')
  assert.deepEqual(body.error.details, [{ field: 'title', message: 'Title is required' }])
})

test('invalid ObjectId is reported as not found', () => {
  const error = new mongoose.Error.CastError('ObjectId', 'abc', '_id')

  assert.equal(toErrorResponse(error).status, 404)
})

test('unexpected errors become 500 without leaking details', () => {
  const { status, body } = toErrorResponse(new Error('secret stack info'))

  assert.equal(status, 500)
  assert.deepEqual(body, { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong on the server' } })
})
