// Small pure helpers for the class pages, unit tested.

// The 5 colours of the "create class" dialog, same names as the server (US04)
export const CLASS_COLORS = {
  purple: '#6b50e3',
  blue: '#2563eb',
  green: '#2f7a3b',
  orange: '#c2410c',
  pink: '#db2777',
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

// "1 học viên", "12 học viên"
export function studentCountLabel(count) {
  return `${count ?? 0} học viên`
}
