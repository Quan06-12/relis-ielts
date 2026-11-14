import { Attempt } from '../models/Attempt.js'

// Facts about what a user has already done, shared by the personal and class libraries.

// testId → band of the user's latest submitted full attempt (the stamp on a test card)
export async function findLastBands(userId, testIds) {
  const attempts = await Attempt.find({ userId, testId: { $in: testIds }, status: 'submitted', 'result.band': { $ne: null } })
    .sort({ submittedAt: -1 })
    .select('testId result')
  const bands = new Map()
  for (const attempt of attempts) {
    const id = String(attempt.testId)
    if (!bands.has(id)) bands.set(id, attempt.result.band)
  }
  return bands
}

// Ids of the tests the user has submitted at least once, alone or from a class (US23 "Đã làm")
export function findDoneTestIds(userId) {
  return Attempt.distinct('testId', { userId, status: 'submitted' })
}
