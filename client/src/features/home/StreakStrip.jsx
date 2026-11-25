import { useEffect, useState } from 'react'
import { getActivity } from '../../api/attempts.js'
import { toKey, formatMinutes } from './activityCalendar.js'
import { streakDays, lastWeekTotals } from './homeToday.js'

const DAYS_SHOWN = 14

// Practice streak (US42, short form): the current run of days with a submission and the last
// two weeks as a strip of dots, filled on the days something was handed in.
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
    <section className="home-panel streak-panel">
      <div className="home-panel-header">
        <h2>Chuỗi ngày luyện tập</h2>
      </div>
      <div className="streak-body">
        <p className="streak-count">
          <span className="streak-flame" aria-hidden="true">🔥</span>
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
              <small>{day.weekday}</small>
            </li>
          ))}
        </ol>
        <p className="home-hint">
          7 ngày qua: {week.submissions} bài nộp · {formatMinutes(week.minutes)} luyện tập
        </p>
      </div>
    </section>
  )
}
