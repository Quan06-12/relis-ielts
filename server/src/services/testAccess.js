import { Test } from '../models/Test.js'
import { notFound } from '../errors/AppError.js'

// Loads a test that belongs to the user (for the editor). Anyone else gets 404.
export async function findOwnedTest(testId, userId) {
  const test = await Test.findOne({ _id: testId, ownerId: userId, hidden: false })
  if (!test) {
    throw notFound('Test')
  }
  return test
}

// Loads a test the user is allowed to take.
// Sprint 1: only the owner. Sprint 2 adds members of a class that has this test.
export async function findTestUserCanTake(testId, userId) {
  return findOwnedTest(testId, userId)
}
