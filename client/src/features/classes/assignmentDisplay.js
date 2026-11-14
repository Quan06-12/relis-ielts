// Small pure helpers for the "Assignments" tab (US44, US45), unit tested.

export const STATUS_LABEL = {
  todo: 'Cần làm',
  in_progress: 'Đang làm',
  submitted: 'Đã nộp',
  late: 'Nộp trễ',
  missed: 'Quá hạn',
}

// Order of the groups a student sees: what needs doing first
const STATUS_ORDER = ['in_progress', 'todo', 'late', 'submitted', 'missed']

// [{ status, label, items }] without empty groups
export function groupByStatus(assignments) {
  return STATUS_ORDER.map((status) => ({
    status,
    label: STATUS_LABEL[status],
    items: assignments.filter((assignment) => assignment.myStatus === status),
  })).filter((group) => group.items.length > 0)
}

// "còn 2 ngày", "còn 5 giờ", "còn 40 phút", "đã hết hạn"
export function timeLeftLabel(deadline, now = new Date()) {
  const minutes = Math.floor((new Date(deadline) - now) / 60000)
  if (minutes < 0) return 'đã hết hạn'
  if (minutes < 60) return `còn ${minutes} phút`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `còn ${hours} giờ`
  return `còn ${Math.floor(hours / 24)} ngày`
}

// Value for <input type="datetime-local"> one week from now, in local time: "2026-11-21T23:59"
export function defaultDeadlineInput(now = new Date()) {
  const date = new Date(now)
  date.setDate(date.getDate() + 7)
  date.setHours(23, 59, 0, 0)
  const pad = (number) => String(number).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const SKILL_CHIP = { reading: 'Reading', listening: 'Listening' }
const KIND_CHIP = { full: 'Full test', single: 'Một phần' }

// Small labels on an assignment row (wireframe): skill, full test or not, and open/closed.
// tone picks the colour in CSS.
export function assignmentChips(assignment, now = new Date()) {
  const chips = []
  const test = assignment.test
  if (test?.skill) chips.push({ label: SKILL_CHIP[test.skill], tone: test.skill })
  if (test?.kind) chips.push({ label: KIND_CHIP[test.kind], tone: 'plain' })
  const isOpen = new Date(assignment.deadline) > now || assignment.allowLate
  chips.push(isOpen ? { label: 'Đang mở', tone: 'open' } : { label: 'Đã đóng', tone: 'plain' })
  return chips
}

// "20:00 · 04/11" (the year is left out, deadlines are close)
export function shortDeadline(deadline) {
  const date = new Date(deadline)
  const pad = (number) => String(number).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())} · ${pad(date.getDate())}/${pad(date.getMonth() + 1)}`
}

// Average score on a teacher's row: "6.5" band for full tests, otherwise "8.5/13" correct answers
export function averageLabel(assignment) {
  if (assignment.averageBand !== null && assignment.averageBand !== undefined) {
    return { value: assignment.averageBand.toFixed(1), unit: 'band TB' }
  }
  if (assignment.averageCorrect !== null && assignment.averageCorrect !== undefined) {
    return { value: `${assignment.averageCorrect}/${assignment.test?.questionCount ?? '?'}`, unit: 'câu đúng TB' }
  }
  return { value: '—', unit: 'chưa có bài' }
}
