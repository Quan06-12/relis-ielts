import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { updateMyProfile } from '../api/users.js'
import { listMyAttempts } from '../api/attempts.js'
import { getErrorMessage } from '../api/errorMessages.js'
import { daysUntil, latestBands, gapLabel, BAND_CHOICES } from '../features/home/homeStats.js'
import { scoreLabel } from '../features/history/historyGroups.js'
import './HomePage.css'

const SKILL_LABEL = { reading: 'Reading', listening: 'Listening' }

// Home page (US46): target bands and exam date, latest band against the goal,
// unfinished attempts to continue and the last few results.
export default function HomePage() {
  const { user } = useAuth()
  const [recent, setRecent] = useState([])
  const [unfinished, setUnfinished] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([listMyAttempts({ status: 'submitted', limit: 20 }), listMyAttempts({ status: 'in_progress', limit: 5 })])
      .then(([submitted, inProgress]) => {
        setRecent(submitted.items)
        setUnfinished(inProgress.items)
      })
      .catch((loadError) => setError(getErrorMessage(loadError)))
  }, [])

  const goals = user.goals ?? {}
  const bands = latestBands(recent)
  const daysLeft = daysUntil(user.examDate)

  return (
    <main className="page home-page">
      <h1>Chào {user.name.split(' ').at(-1)} 👋</h1>
      {error && <p className="library-message error">{error}</p>}

      <section className="home-goals">
        <div className="home-goals-header">
          <h2>Mục tiêu</h2>
          <button type="button" className="secondary-button" onClick={() => setIsEditing(true)}>
            {goals.overall || goals.reading || goals.listening ? 'Sửa' : 'Đặt mục tiêu'}
          </button>
        </div>

        <div className="home-cards">
          {['reading', 'listening'].map((skill) => (
            <div key={skill} className={`home-card ${skill}`}>
              <p className="home-card-label">{SKILL_LABEL[skill]}</p>
              <p className="home-card-value">{bands[skill] !== null ? bands[skill].toFixed(1) : '—'}</p>
              <p className="home-card-note">
                Mục tiêu {goals[skill] ? goals[skill].toFixed(1) : '—'}
                {gapLabel(bands[skill], goals[skill]) && ` · ${gapLabel(bands[skill], goals[skill])}`}
              </p>
            </div>
          ))}
          <div className="home-card">
            <p className="home-card-label">Overall mục tiêu</p>
            <p className="home-card-value">{goals.overall ? goals.overall.toFixed(1) : '—'}</p>
            <p className="home-card-note">{examLabel(daysLeft)}</p>
          </div>
        </div>
        <p className="home-hint">Band gần nhất lấy từ lần làm full đề gần nhất của mỗi kỹ năng.</p>
      </section>

      {unfinished.length > 0 && (
        <section>
          <h2>Đang làm dở</h2>
          <ul className="home-list">
            {unfinished.map((attempt) => (
              <li key={attempt.id}>
                <span>{attempt.test?.title}</span>
                <Link to={`/attempts/${attempt.id}`} className="primary-button">Làm tiếp</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <div className="home-goals-header">
          <h2>Kết quả gần đây</h2>
          <Link to="/history">Xem tất cả →</Link>
        </div>
        {recent.length === 0 ? (
          <p className="library-message">
            Chưa có bài nào. <Link to="/library">Vào Kho đề để làm bài đầu tiên</Link>
          </p>
        ) : (
          <ul className="home-list">
            {recent.slice(0, 5).map((attempt) => (
              <li key={attempt.id}>
                <span>
                  {attempt.test?.title}
                  <small> · {new Date(attempt.submittedAt).toLocaleDateString('vi-VN')}</small>
                </span>
                <Link to={`/attempts/${attempt.id}/review`}>{scoreLabel(attempt.result)}</Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {isEditing && <GoalsDialog user={user} onClose={() => setIsEditing(false)} />}
    </main>
  )
}

function examLabel(daysLeft) {
  if (daysLeft === null) return 'Chưa đặt ngày thi'
  if (daysLeft > 0) return `Còn ${daysLeft} ngày đến ngày thi`
  if (daysLeft === 0) return 'Hôm nay là ngày thi, chúc may mắn!'
  return 'Ngày thi đã qua'
}

// US46: target band for each skill and overall, and the exam date
function GoalsDialog({ user, onClose }) {
  const { updateUser } = useAuth()
  const [goals, setGoals] = useState({
    reading: user.goals?.reading ?? null,
    listening: user.goals?.listening ?? null,
    overall: user.goals?.overall ?? null,
  })
  const [examDate, setExamDate] = useState(user.examDate ? user.examDate.slice(0, 10) : '')
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    try {
      updateUser(await updateMyProfile({ goals, examDate: examDate === '' ? null : examDate }))
      onClose()
    } catch (saveError) {
      setError(getErrorMessage(saveError))
    }
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <form className="dialog class-form" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()} onSubmit={handleSubmit}>
        <h2>Mục tiêu</h2>
        {[
          ['reading', 'Reading'],
          ['listening', 'Listening'],
          ['overall', 'Overall'],
        ].map(([skill, label]) => (
          <label key={skill}>
            {label}
            <select
              value={goals[skill] ?? ''}
              onChange={(event) => setGoals((current) => ({ ...current, [skill]: event.target.value === '' ? null : Number(event.target.value) }))}
            >
              <option value="">Chưa đặt</option>
              {BAND_CHOICES.map((band) => (
                <option key={band} value={band}>{band.toFixed(1)}</option>
              ))}
            </select>
          </label>
        ))}
        <label>
          Ngày thi (không bắt buộc)
          <input type="date" value={examDate} onChange={(event) => setExamDate(event.target.value)} />
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="dialog-actions">
          <button type="button" className="secondary-button" onClick={onClose}>Huỷ</button>
          <button type="submit" className="primary-button">Lưu</button>
        </div>
      </form>
    </div>
  )
}
