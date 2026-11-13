import { Test } from '../models/Test.js'
import { notFound } from '../errors/AppError.js'
import { isInOneOfMyClasses } from './classAccess.js'

// Loads a test that belongs to the user (for the editor). Anyone else gets 404.
export async function findOwnedTest(testId, userId) {
  const test = await Test.findOne({ _id: testId, ownerId: userId, hidden: false })
  if (!test) {
    throw notFound('Test')
  }
  return test
}

// Loads a test the user is allowed to take: their own test, or a published test
// in the library of a class they belong to (US22).
export async function findTestUserCanTake(testId, userId) {
  const test = await Test.findOne({ _id: testId, hidden: false })
  if (!test) {
    throw notFound('Test')
  }

  if (String(test.ownerId) === String(userId)) {
    return test
  }

  if (test.status === 'published' && (await isInOneOfMyClasses(test._id, userId))) {
    return test
  }

  throw notFound('Test')
}
