import { User } from '../models/User.js'
import { Test } from '../models/Test.js'
import { Attempt } from '../models/Attempt.js'
import { Class } from '../models/Class.js'
import { Assignment } from '../models/Assignment.js'
import { SYSTEM_GOOGLE_ID } from '../services/systemOwner.js'
import { dailySeries } from '../utils/adminStats.js'

const DAYS = 30

// GET /api/admin/stats — numbers for the admin page: totals, the last 30 days, the most taken system tests
export async function getStats(request, response) {
  const now = new Date()
  const since = new Date(now.getTime() - (DAYS + 1) * 24 * 60 * 60 * 1000)
  const people = { googleId: { $ne: SYSTEM_GOOGLE_ID } } // the built-in Relis account is not a person

  const [googleUsers, guests, userTests, systemPublished, systemDrafts, submitted, inProgress, classes, assignments, recentUsers, recentAttempts, top] =
    await Promise.all([
      User.countDocuments({ ...people, isGuest: { $ne: true } }), // older accounts have no isGuest field
      User.countDocuments({ isGuest: true }),
      Test.countDocuments({ isSystem: { $ne: true }, hidden: false }),
      Test.countDocuments({ isSystem: true, hidden: false, status: 'published' }),
      Test.countDocuments({ isSystem: true, hidden: false, status: 'draft' }),
      Attempt.countDocuments({ status: 'submitted' }),
      Attempt.countDocuments({ status: 'in_progress' }),
      Class.countDocuments(),
      Assignment.countDocuments(),
      User.find({ ...people, createdAt: { $gte: since } }, { createdAt: 1 }).lean(),
      Attempt.find({ status: 'submitted', submittedAt: { $gte: since } }, { submittedAt: 1 }).lean(),
      topSystemTests(5),
    ])

  response.json({
    users: { total: googleUsers + guests, google: googleUsers, guests },
    tests: { byUsers: userTests, system: systemPublished, systemDrafts },
    attempts: { submitted, inProgress },
    classes: { total: classes, assignments },
    daily: dailySeries(recentUsers, recentAttempts, now, DAYS),
    topSystemTests: top,
  })
}

// System tests ranked by handed-in attempts, with the average band of full-test attempts
async function topSystemTests(limit) {
  const systemTests = await Test.find({ isSystem: true, hidden: false }, { title: 1, skill: 1, kind: 1 }).lean()
  if (systemTests.length === 0) return []
  const rows = await Attempt.aggregate([
    { $match: { status: 'submitted', testId: { $in: systemTests.map((test) => test._id) } } },
    { $group: { _id: '$testId', attempts: { $sum: 1 }, users: { $addToSet: '$userId' }, averageBand: { $avg: '$result.band' } } },
    { $sort: { attempts: -1 } },
    { $limit: limit },
  ])
  const byId = new Map(systemTests.map((test) => [String(test._id), test]))
  return rows.map((row) => {
    const test = byId.get(String(row._id))
    return {
      id: String(row._id),
      title: test.title,
      skill: test.skill,
      kind: test.kind,
      attempts: row.attempts,
      users: row.users.length,
      averageBand: row.averageBand === null ? null : Math.round(row.averageBand * 2) / 2,
    }
  })
}
