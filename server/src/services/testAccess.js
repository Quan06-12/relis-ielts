import { Test } from '../models/Test.js'
import { notFound } from '../errors/AppError.js'
import { isInOneOfMyClasses } from './classAccess.js'
import { User } from '../models/User.js'
import { isAdminUser } from '../utils/admin.js'

// Loads a test that belongs to the user (for the editor). Anyone else gets 404.
export async function findOwnedTest(testId, userId) {
  const test = await Test.findOne({ _id: testId, ownerId: userId, hidden: false })
  if (!test) {
    throw notFound('Test')
  }
  return test
}

// Loads a test the user may edit: their own test, or a system test when they are an admin.
// Anyone else gets 404, as if the test did not exist.
export async function findEditableTest(testId, userId) {
  const test = await Test.findOne({ _id: testId, hidden: false })
  if (!test) {
    throw notFound('Test')
  }
  if (String(test.ownerId) === String(userId)) {
    return test
  }
  if (test.isSystem && (await isAdmin(userId))) {
    return test
  }
  throw notFound('Test')
}

export async function isAdmin(userId) {
  return isAdminUser(await User.findById(userId))
}

// Loads a test the user is allowed to take: their own test, a published system test,
// or a published test in the library of a class they belong to (US22).
export async function findTestUserCanTake(testId, userId) {
  const test = await Test.findOne({ _id: testId, hidden: false })
  if (!test) {
    throw notFound('Test')
  }

  if (String(test.ownerId) === String(userId)) {
    return test
  }

  if (test.status === 'published' && test.isSystem) {
    return test
  }

  // An admin may try a system test that is still a draft before publishing it
  if (test.isSystem && (await isAdmin(userId))) {
    return test
  }

  if (test.status === 'published' && (await isInOneOfMyClasses(test._id, userId))) {
    return test
  }

  throw notFound('Test')
}

// Filter for the tests a teacher may put into a class or assign: their own published tests
// and the published system tests.
export function shareableTestFilter(userId) {
  return { $or: [{ ownerId: userId }, { isSystem: true }], status: 'published', hidden: false }
}
