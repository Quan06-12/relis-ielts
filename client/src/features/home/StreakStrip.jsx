import { useEffect, useState } from 'react'
import { getActivity } from '../../api/attempts.js'
import { toKey, formatMinutes } from './activityCalendar.js'
import { streakDays, lastWeekTotals } from './homeToday.js'

const DAYS_SHOWN = 14

// Practice streak (US42, short form), shown as the last row of the goals panel: the current run of days
// with a submission and the last two weeks as dots, filled on the days something was handed in.
export default function StreakStrip() {
  const [activity, setActivity] = useState(null)

  useEffect(() => {
    const today = new Date()
    const from = new Date(today)
    from.setDate(from.getDate() - (DAYS_SHOWN - 1))
    getActivity(toKey(from), toKey(today))
      .then(setActivity)
      .catch(() => setActivity({ days: [], currentStreak: 0 }))
  }, [])

  const days = streakDays(activity?.days ?? [], new Date(), DAYS_SHOWN)
  const week = lastWeekTotals(activity?.days ?? [])
  const streak = activity?.currentStreak ?? 0

  return (
    <div className="streak-row">
      <p className="streak-count" title="Số ngày liên tiếp có nộp bài">
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5.5 2 1.5 3 3 3-1-3 0-6 0-8.5z" />
        </svg>
        <strong>{streak}</strong> ngày liên tiếp
      </p>
      <ol className="streak-days" aria-label={`${DAYS_SHOWN} ngày gần nhất`}>
        {days.map((day) => (
          <li
            key={day.key}
            className={`${day.active ? 'active' : ''} ${day.isToday ? 'today' : ''}`}
            title={`${day.dayOfMonth}/${day.key.slice(5, 7)}: ${day.active ? `${day.submissions} bài` : 'chưa nộp bài'}`}
          >
            <span className="streak-dot" />
          </li>
        ))}
      </ol>
      <p className="streak-week">7 ngày qua: {week.submissions} bài · {formatMinutes(week.minutes)}</p>
    </div>
  )
}
