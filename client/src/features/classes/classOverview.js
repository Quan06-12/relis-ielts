// The row of numbers under the class header, worked out from data the page already loads
// (assignments for everyone, the gradebook for the teacher). Pure, so it is unit tested.
import { timeLeftLabel, shortDeadline } from './assignmentDisplay.js'

// The open assignment with the closest deadline, or null
function nextDeadline(assignments, now) {
  const upcoming = assignments.filter((item) => new Date(item.deadline) > now).sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
  return upcoming[0] ?? null
}

function deadlineTile(assignments, now, emptyText) {
  const next = nextDeadline(assignments, now)
  return next
    ? { key: 'deadline', label: 'Hạn nộp gần nhất', value: timeLeftLabel(next.deadline, now).replace('còn ', ''), detail: `${next.test?.title ?? 'Bài tập'} · ${shortDeadline(next.deadline)}`, tone: 'warn' }
    : { key: 'deadline', label: 'Hạn nộp gần nhất', value: '—', detail: emptyText }
}

// IELTS-style rounding of an average band: 6.25 → 6.5
const roundToHalf = (value) => Math.round(value * 2) / 2

export function teacherOverview({ assignments, gradebook, studentCount, now = new Date() }) {
  const bands = (gradebook?.rows ?? []).map((row) => row.averageBand).filter((band) => band !== null && band !== undefined)
  const classBand = bands.length > 0 ? roundToHalf(bands.reduce((sum, band) => sum + band, 0) / bands.length) : null

  const expected = assignments.reduce((sum, item) => sum + (item.studentCount ?? 0), 0)
  const handedIn = assignments.reduce((sum, item) => sum + (item.submittedCount ?? 0), 0)
  const rate = expected > 0 ? Math.round((handedIn / expected) * 100) : null

  return [
    { key: 'students', label: 'Học viên', value: String(studentCount ?? 0), detail: 'trong lớp' },
    {
      key: 'band',
      label: 'Band TB lớp',
      value: classBand !== null ? classBand.toFixed(1) : '—',
      detail: classBand !== null ? `từ ${bands.length} học viên có full test` : 'chưa ai làm full test',
      tone: 'primary',
    },
    {
      key: 'rate',
      label: 'Tỉ lệ nộp bài',
      value: rate !== null ? `${rate}%` : '—',
      detail: rate !== null ? `${handedIn}/${expected} lượt nộp` : 'chưa giao bài nào',
      tone: rate !== null && rate < 50 ? 'warn' : 'good',
    },
    deadlineTile(assignments, now, 'không có bài đang mở'),
  ]
}

export function studentOverview({ assignments, now = new Date() }) {
  const todo = assignments.filter((item) => item.myStatus === 'todo' || item.myStatus === 'in_progress').length
  const done = assignments.filter((item) => item.myStatus === 'submitted' || item.myStatus === 'late').length
  return [
    { key: 'todo', label: 'Bài cần làm', value: String(todo), detail: todo > 0 ? 'chưa nộp' : 'đã xong hết', tone: todo > 0 ? 'warn' : 'good' },
    { key: 'done', label: 'Đã nộp', value: String(done), detail: `trên ${assignments.length} bài được giao` },
    deadlineTile(assignments.filter((item) => item.myStatus === 'todo' || item.myStatus === 'in_progress'), now, 'không có bài sắp đến hạn'),
  ]
}
