import { useEffect, useState } from 'react'
import { getStudyTime } from '../../api/attempts.js'
import { getErrorMessage } from '../../api/errorMessages.js'
import { monthLabel, hourScale, hourLabel, shortTime, totalHoursText } from './studyTime.js'

const MONTHS = 5

// "Thời gian học" on the home page: stacked bars of Reading and Listening hours for the last 5 months.
// Hovering (or focusing) a bar shows its exact time.
export default function StudyTimeChart() {
  const [months, setMonths] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getStudyTime(MONTHS)
      .then((data) => setMonths(data.months))
      .catch((loadError) => setError(getErrorMessage(loadError)))
  }, [])

  if (error) return <p className="library-message error">{error}</p>
  if (!months) return <p className="library-message">Đang tải…</p>

  const maxHours = Math.max(...months.map((row) => (row.readingMinutes + row.listeningMinutes) / 60))
  const { top, ticks } = hourScale(maxHours)
  const heightOf = (minutes) => `${(minutes / 60 / top) * 100}%`

  return (
    <div className="study-time">
      <div className="study-chart">
        {/* Horizontal guide lines with their hour labels, from 0 at the bottom */}
        <div className="study-axis" aria-hidden="true">
          {[...ticks].reverse().map((tick) => (
            <div key={tick} className="study-tick">
              <span>{hourLabel(tick)}</span>
            </div>
          ))}
        </div>

        <div className="study-bars">
          {months.map((row) => (
            <div key={row.month} className="study-month">
              <button
                type="button"
                className="study-bar"
                style={{ '--fill': heightOf(row.readingMinutes + row.listeningMinutes) }}
                aria-label={`${monthLabel(row.month)}: ${shortTime(row.readingMinutes)} Reading, ${shortTime(row.listeningMinutes)} Listening`}
              >
                <span className="study-tip">
                  {shortTime(row.readingMinutes)} Reading · {shortTime(row.listeningMinutes)} Listening
                </span>
                <span className="study-listening" style={{ height: heightOf(row.listeningMinutes) }} />
                <span className="study-reading" style={{ height: heightOf(row.readingMinutes) }} />
              </button>
              <span className="study-label">{monthLabel(row.month)}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="activity-summary">
        <span>{MONTHS} tháng gần nhất: <strong>{totalHoursText(months)} giờ</strong></span>
        <span>Đơn vị: giờ / tháng</span>
      </p>
    </div>
  )
}
