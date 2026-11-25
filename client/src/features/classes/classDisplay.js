// Small pure helpers for the class pages, unit tested.

// The 5 colours of the "create class" dialog, same names as the server (US04), shades from the wireframe
export const CLASS_COLORS = {
  purple: '#5b3fd6',
  blue: '#1d4ed8',
  green: '#0f766e',
  orange: '#c2410c',
  pink: '#be185d',
}

export function colorOf(name) {
  return CLASS_COLORS[name] ?? CLASS_COLORS.purple
}

// One gradebook cell (US40): band for a full test, otherwise "correct/total", "—" when not done
export function formatScore(cell) {
  if (!cell) return '—'
  if (cell.band !== null && cell.band !== undefined) return cell.band.toFixed(1)
  if (cell.correct !== null && cell.total !== null) return `${cell.correct}/${cell.total}`
  return '—'
}

// Colour level of a gradebook cell: by band for a full test, otherwise by the share of correct answers.
// high = band 7+ or 75%+, mid = band 5.5+ or 50%+, low = below that; null when there is no score.
export function scoreLevel(cell) {
  if (!cell) return null
  if (cell.band !== null && cell.band !== undefined) {
    if (cell.band >= 7) return 'high'
    return cell.band >= 5.5 ? 'mid' : 'low'
  }
  if (!cell.total) return null
  const share = cell.correct / cell.total
  if (share >= 0.75) return 'high'
  return share >= 0.5 ? 'mid' : 'low'
}

// "1 học viên", "12 học viên"
export function studentCountLabel(count) {
  return `${count ?? 0} học viên`
}

const DAY_MS = 24 * 60 * 60 * 1000

// The box on a student's class card: "Hạn hôm nay" (red), "Sắp đến hạn · còn 2 ngày" (yellow),
// or nothing due (green). nextDue = { title, deadline } | null from GET /classes.
export function nextDueBox(nextDue, now = new Date()) {
  if (!nextDue) return { tone: 'done', heading: 'Không có bài sắp đến hạn', detail: 'Bạn đã nộp hết bài được giao.' }
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const deadlineDay = new Date(nextDue.deadline)
  deadlineDay.setHours(0, 0, 0, 0)
  const days = Math.round((deadlineDay - startOfToday) / DAY_MS)
  if (days <= 0) return { tone: 'urgent', heading: 'Hạn hôm nay', detail: nextDue.title }
  return { tone: 'soon', heading: `Sắp đến hạn · còn ${days} ngày`, detail: nextDue.title }
}

// Splits my classes into the two sections of the page, keeping the server order
export function splitByRole(classes) {
  return {
    teaching: classes.filter((item) => item.myRole === 'teacher'),
    studying: classes.filter((item) => item.myRole === 'student'),
  }
}
