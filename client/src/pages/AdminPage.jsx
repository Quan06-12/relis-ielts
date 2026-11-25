import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { getAdminStats } from '../api/admin.js'
import { getErrorMessage } from '../api/errorMessages.js'
import NotFoundPage from './NotFoundPage.jsx'
import './AdminPage.css'

const SKILL_LABEL = { reading: 'Reading', listening: 'Listening' }

// Admin page: totals, activity of the last 30 days, the most taken system tests,
// and the way into managing "Kho đề Relis". Only admins see the tab; anyone else gets the 404 page.
export default function AdminPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user?.isAdmin) return
    getAdminStats()
      .then(setStats)
      .catch((loadError) => setError(getErrorMessage(loadError)))
  }, [user?.isAdmin])

  if (!user?.isAdmin) return <NotFoundPage />

  return (
    <main className="page admin-page">
      <div className="admin-head">
        <div>
          <h1>Quản trị</h1>
          <p className="admin-sub">Số liệu toàn hệ thống và Kho đề Relis</p>
        </div>
        <div className="admin-actions">
          <Link to="/library" className="secondary-button">Quản lý Kho đề Relis</Link>
          <Link to="/tests/new?system=1" className="primary-button">+ Thêm đề hệ thống</Link>
        </div>
      </div>

      {error && <p className="library-message error">{error}</p>}
      {!stats && !error && <p className="admin-loading">Đang tải số liệu…</p>}

      {stats && (
        <>
          <section className="admin-tiles" aria-label="Tổng quan">
            <Tile label="Người dùng" value={stats.users.total} detail={`${stats.users.google} Google · ${stats.users.guests} khách`} />
            <Tile label="Bài đã nộp" value={stats.attempts.submitted} detail={`${stats.attempts.inProgress} bài đang làm dở`} tone="primary" />
            <Tile label="Kho đề Relis" value={stats.tests.system} detail={stats.tests.systemDrafts > 0 ? `+ ${stats.tests.systemDrafts} đề nháp` : 'đề đã xuất bản'} tone="good" />
            <Tile label="Đề người dùng tạo" value={stats.tests.byUsers} detail="đề của giáo viên và học viên" />
            <Tile label="Lớp học" value={stats.classes.total} detail={`${stats.classes.assignments} bài tập đã giao`} tone="warn" />
          </section>

          <section className="admin-card" aria-labelledby="admin-chart-title">
            <div className="admin-card-head">
              <h2 id="admin-chart-title">30 ngày qua</h2>
              <ul className="admin-legend">
                <li><span className="dot attempts" /> Bài nộp</li>
                <li><span className="dot users" /> Người dùng mới</li>
              </ul>
            </div>
            <ActivityChart days={stats.daily} />
          </section>

          <section className="admin-card" aria-labelledby="admin-top-title">
            <h2 id="admin-top-title">Đề hệ thống được làm nhiều nhất</h2>
            {stats.topSystemTests.length === 0 ? (
              <p className="admin-empty">Chưa có ai nộp bài đề hệ thống.</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr><th>Đề</th><th>Kỹ năng</th><th>Lượt nộp</th><th>Người làm</th><th>Band TB</th></tr>
                </thead>
                <tbody>
                  {stats.topSystemTests.map((test) => (
                    <tr key={test.id}>
                      <td className="admin-test-title">{test.title}</td>
                      <td><span className={`skill-chip ${test.skill}`}>{SKILL_LABEL[test.skill]}</span> {test.kind === 'full' ? 'Full' : 'Bài lẻ'}</td>
                      <td>{test.attempts}</td>
                      <td>{test.users}</td>
                      <td>{test.averageBand === null ? '—' : test.averageBand.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </main>
  )
}

function Tile({ label, value, detail, tone = '' }) {
  return (
    <div className={`overview-tile ${tone}`}>
      <p className="overview-label">{label}</p>
      <p className="overview-value">{value}</p>
      <p className="overview-detail">{detail}</p>
    </div>
  )
}

// Two bars per day (attempts handed in, new users), drawn with CSS so it needs no chart library
function ActivityChart({ days }) {
  const top = Math.max(1, ...days.map((day) => Math.max(day.attempts, day.newUsers)))
  return (
    <div className="admin-chart" role="img" aria-label={`Bài nộp và người dùng mới trong ${days.length} ngày qua`}>
      <div className="admin-chart-scale" aria-hidden="true">
        <span>{top}</span>
        <span>0</span>
      </div>
      <div className="admin-chart-bars">
        {days.map((day, index) => (
          <div key={day.date} className="admin-chart-day" title={`${formatDay(day.date)}: ${day.attempts} bài nộp, ${day.newUsers} người dùng mới`}>
            <div className="bars">
              <span className="bar attempts" style={{ height: `${(day.attempts / top) * 100}%` }} />
              <span className="bar users" style={{ height: `${(day.newUsers / top) * 100}%` }} />
            </div>
            <span className="admin-chart-label">{index % 5 === 4 || index === days.length - 1 ? formatDay(day.date) : ''}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// "2026-11-25" → "25/11"
function formatDay(date) {
  const [, month, day] = date.split('-')
  return `${day}/${month}`
}
