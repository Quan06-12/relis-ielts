import { Attempt } from '../models/Attempt.js'
import { ClassMember } from '../models/ClassMember.js'
import { User } from '../models/User.js'
import { buildLeaderboard } from '../utils/leaderboard.js'
import { dayKey, safeTimeZone } from '../utils/activity.js'

const DAY_MS = 24 * 60 * 60 * 1000

// GET /api/classes/:classId/leaderboard?tz=Asia/Ho_Chi_Minh — any member (wireframe "Bảng xếp hạng")
// Students of the class ranked by what they submitted in this class this week (Monday to Sunday),
// with study minutes, average band and how many places they moved since last week.
export async function getLeaderboard(request, response) {
  const { classId } = request.params
  const timeZone = safeTimeZone(request.query.tz)

  const memberships = await ClassMember.find({ classId, role: 'student' }).select('userId')
  const students = await User.find({ _id: { $in: memberships.map((membership) => membership.userId) } }).select('name avatarUrl')

  // Two weeks plus a day either side covers last week and this week in any time zone
  const attempts = await Attempt.find({
    classId,
    status: 'submitted',
    submittedAt: { $gte: new Date(Date.now() - 16 * DAY_MS) },
  }).select('userId mode startedAt submittedAt result')

  const rows = buildLeaderboard(students, attempts, dayKey(new Date(), timeZone), timeZone)
  response.json({ items: rows })
}
