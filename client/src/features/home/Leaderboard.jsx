import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listMyClasses, getLeaderboard } from '../../api/classes.js'
import { getErrorMessage } from '../../api/errorMessages.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { initialsOf } from '../../components/initials.js'
import { formatMinutes } from './activityCalendar.js'
import { SkeletonRows } from '../../components/Skeleton.jsx'
import './Leaderboard.css'

// Home page (wireframe "Bảng xếp hạng"): this week's ranking in one of my classes.
// Ranked by submissions in the class, then study time; arrows show the move since last week.
export default function Leaderboard() {
  const { user } = useAuth()
  const [classes, setClasses] = useState(null)
  const [classId, setClassId] = useState('')
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    listMyClasses()
      .then((items) => {
        setClasses(items)
        // Start with a class I study in: that is where I compete
        const first = items.find((item) => item.myRole === 'student') ?? items[0]
        if (first) setClassId(first.id)
      })
      .catch((loadError) => setError(getErrorMessage(loadError)))
  }, [])

  useEffect(() => {
    if (!classId) return
    setRows(null)
    getLeaderboard(classId)
      .then(setRows)
      .catch((loadError) => setError(getErrorMessage(loadError)))
  }, [classId])

  return (
    <section className="home-panel leaderboard">
      <div className="home-panel-header">
        <div className="leaderboard-title">
          <h2>Bảng xếp hạng</h2>
          {classes?.length > 0 && (
            <select className="leaderboard-class" value={classId} onChange={(event) => setClassId(event.target.value)} aria-label="Chọn lớp">
              {classes.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          )}
        </div>
        <span className="leaderboard-week">Tuần này</span>
      </div>

      {error && <p className="library-message error leaderboard-pad">{error}</p>}
      {!error && classes?.length === 0 && (
        <p className="library-message leaderboard-pad">
          Vào một lớp để thi đua cùng bạn học. <Link to="/classes">Đến trang Lớp học →</Link>
        </p>
      )}
      {!error && classId && !rows && <div className="leaderboard-pad"><SkeletonRows count={3} /></div>}
      {rows?.length === 0 && <p className="library-message leaderboard-pad">Lớp chưa có học viên nào.</p>}

      {rows?.length > 0 && (
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Hạng</th>
              <th>Học sinh</th>
              <th>Số bài</th>
              <th>Giờ học</th>
              <th>Band TB</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.userId} className={row.userId === user.id ? 'me' : ''}>
                <td>
                  <span className="rank-badge">{row.rank}</span>
                  <RankChange change={row.change} />
                </td>
                <td>
                  <span className="leaderboard-student">
                    <span className="leaderboard-avatar">{initialsOf(row.name)}</span>
                    {row.name}
                    {row.userId === user.id && <small> (bạn)</small>}
                  </span>
                </td>
                <td>{row.count}</td>
                <td>{formatMinutes(row.minutes)}</td>
                <td className="leaderboard-band">{row.averageBand !== null ? row.averageBand.toFixed(1) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}

// ▲ moved up, ▼ moved down, – same place or nothing last week
function RankChange({ change }) {
  if (change > 0) return <span className="rank-change up" title={`Lên ${change} hạng so với tuần trước`}>▲</span>
  if (change < 0) return <span className="rank-change down" title={`Xuống ${-change} hạng so với tuần trước`}>▼</span>
  return <span className="rank-change same" title={change === 0 ? 'Giữ hạng' : 'Tuần trước chưa có bài'}>–</span>
}
