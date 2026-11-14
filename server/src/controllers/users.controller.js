import { User } from '../models/User.js'
import { notFound, validationError } from '../errors/AppError.js'
import { checkProfileChanges } from '../utils/goals.js'

// PATCH /api/users/me — set target bands and exam date (US46)
// Only the fields that are sent change; send null to clear one.
export async function updateMyProfile(request, response) {
  const body = request.body ?? {}
  const problems = checkProfileChanges(body)
  if (problems.length > 0) throw validationError(problems)

  const changes = {}
  for (const skill of ['reading', 'listening', 'overall']) {
    if (body.goals?.[skill] !== undefined) changes[`goals.${skill}`] = body.goals[skill]
  }
  if (body.examDate !== undefined) changes.examDate = body.examDate === null ? null : new Date(body.examDate)

  const user = await User.findByIdAndUpdate(request.userId, { $set: changes }, { new: true })
  if (!user) throw notFound('User')

  response.json({ user })
}
