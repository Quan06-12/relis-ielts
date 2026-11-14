import { useEffect, useState } from 'react'
import { getActivity } from '../../api/attempts.js'
import { getErrorMessage } from '../../api/errorMessages.js'
import {
  toKey,
  monthGrid,
  weekOf,
  weekRows,
  formatMinutes,
  timeLevel,
  activeDaysInMonth,
  displayDate,
} from './activityCalendar.js'
import './ActivityPanels.css'

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

// Home page (US42, wireframe): a month calendar marking the days with a submission ("Biểu đồ chăm chỉ")
// and, next to it, a table of the selected week: Reading and Listening submissions and study time per day.
export default function ActivityPanels() {
  const today = toKey(new Date())
  const [month, setMonth] = useState(() => ({ year: new Date().getFullYear(), index: new Date().getMonth() }))
  const [selectedDay, setSelectedDay] = useState(today)
  const [mode, setMode] = useState('days') // 'days' | 'time'
  const [activity, setActivity] = useState({ days: [], currentStreak: 0 })
  const [error, setError] = useState('')

  const weeks = monthGrid(month.year, month.index)
  const firstKey = weeks[0][0].key
  const lastKey = weeks.at(-1).at(-1).key

  // The whole grid (up to 6 weeks) in one request, so the weekly table never needs a second one
  useEffect(() => {
    getActivity(firstKey, lastKey)
      .then(setActivity)
      .catch((loadError) => setError(getErrorMessage(loadError)))
  }, [firstKey, lastKey])

  const byDate = new Map(activity.days.map((row) => [row.date, row]))
  const selectedWeek = weekOf(selectedDay)
  const { rows, total } = weekRows(activity.days, selectedDay)

  function changeMonth(step) {
    setMonth((current) => {
      const date = new Date(current.year, current.index + step, 1)
      return { year: date.getFullYear(), index: date.getMonth() }
    })
  }

  return (
    <div className="activity-row">
      <section className="home-panel activity-calendar">
        <div className="home-panel-header">
          <div>
            <h2>Biểu đồ &quot;chăm chỉ&quot; của bạn</h2>
            <p className="activity-hint">Bấm vào một ngày để xem thống kê tuần đó</p>
          </div>
          <span className="activity-legend"><i /> {mode === 'days' ? 'Có nộp bài' : 'Đậm = học lâu hơn'}</span>
        </div>

        <div className="activity-body">
          {error && <p className="library-message error">{error}</p>}
          <div className="activity-month">
            <button type="button" className="activity-arrow" onClick={() => changeMonth(-1)} aria-label="Tháng trước">‹</button>
            <strong>Tháng {month.index + 1} / {month.year}</strong>
            <button type="button" className="activity-arrow" onClick={() => changeMonth(1)} aria-label="Tháng sau">›</button>
          </div>

          <table className="activity-grid">
            <thead>
              <tr>
                <th aria-label="Tuần" />
                {WEEKDAYS.map((day) => <th key={day}>{day}</th>)}
              </tr>
            </thead>
            <tbody>
              {weeks.map((week, weekIndex) => (
                <tr key={week[0].key} className={selectedWeek.includes(week[0].key) ? 'selected-week' : ''}>
                  <th scope="row">Tuần {weekIndex + 1}</th>
                  {week.map((cell) => {
                    const row = byDate.get(cell.key)
                    const count = row ? row.reading + row.listening : 0
                    return (
                      <td key={cell.key}>
                        {cell.inMonth && (
                          <button
                            type="button"
                            className={dayClass(cell.key, today, mode, row, count)}
                            onClick={() => setSelectedDay(cell.key)}
                            title={row ? `${count} bài · ${formatMinutes(row.minutes)}` : 'Chưa nộp bài'}
                          >
                            {cell.day}
                          </button>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          <p className="activity-summary">
            <span>Tháng này: <strong>{activeDaysInMonth(activity.days, month.year, month.index)} ngày</strong> có nộp bài</span>
            <span>Chuỗi hiện tại: <strong>{activity.currentStreak} ngày</strong></span>
          </p>

          <div className="segmented activity-modes" role="tablist">
            <button type="button" role="tab" aria-selected={mode === 'days'} className={mode === 'days' ? 'segmented-tab active' : 'segmented-tab'} onClick={() => setMode('days')}>
              Độ chăm chỉ
            </button>
            <button type="button" role="tab" aria-selected={mode === 'time'} className={mode === 'time' ? 'segmented-tab active' : 'segmented-tab'} onClick={() => setMode('time')}>
              Thời gian học
            </button>
          </div>
        </div>
      </section>

      <section className="home-panel activity-week">
        <div className="home-panel-header">
          <div>
            <h2>Số bài đã làm trong tuần</h2>
            <p className="activity-hint">Tuần {displayDate(selectedWeek[0])} – {displayDate(selectedWeek[6])}</p>
          </div>
        </div>
        <table className="week-table">
          <thead>
            <tr>
              <th>Ngày</th>
              <th>Reading</th>
              <th>Listening</th>
              <th>Thời gian học</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.date} className={row.date > today ? 'future' : row.date === today ? 'today' : ''}>
                <td>{displayDate(row.date)}</td>
                <td className={row.reading ? 'has-reading' : ''}>{row.reading || '–'}</td>
                <td className={row.listening ? 'has-listening' : ''}>{row.listening || '–'}</td>
                <td>{formatMinutes(row.minutes)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>Tổng cộng</td>
              <td>{total.reading}</td>
              <td>{total.listening}</td>
              <td>{formatMinutes(total.minutes)}</td>
            </tr>
          </tfoot>
        </table>
      </section>
    </div>
  )
}

// CSS classes of one day: filled when there is a submission ("days" mode) or shaded by minutes ("time" mode)
function dayClass(key, today, mode, row, count) {
  const classes = ['activity-day']
  if (mode === 'days' && count > 0) classes.push('filled')
  if (mode === 'time' && row) classes.push(`level-${timeLevel(row.minutes)}`)
  if (key === today) classes.push('today')
  if (key > today) classes.push('future')
  return classes.join(' ')
}
