// Calendar week starts Monday, consistently in the user's Vietnam timezone.
export function historyGroup(date, now = new Date()) {
  const dayNumber = (d) => Math.floor((new Date(d).getTime() + 7 * 3600000) / 86400000)
  const today = dayNumber(now)
  const monday = today - ((today + 3) % 7)
  const day = dayNumber(date)
  return day >= monday ? 'Tuần này' : day >= monday - 7 ? 'Tuần trước' : 'Trước đó'
}
export const formatDate = (date) =>
  new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(date))
export function clockText(seconds) {
  const safe = Math.max(0, Math.ceil(seconds))
  return `${Math.floor(safe / 60)
    .toString()
    .padStart(2, '0')}:${(safe % 60).toString().padStart(2, '0')}`
}
