import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { updateMyProfile } from '../api/users.js'
import { listMyAttempts } from '../api/attempts.js'
import { getErrorMessage } from '../api/errorMessages.js'
import { daysUntil, latestBands, gapLabel, BAND_CHOICES, todayLabel, goalProgress, overallBand } from '../features/home/homeStats.js'
import { scoreLabel } from '../features/history/historyGroups.js'
import BandChart from '../features/home/BandChart.jsx'
import ActivityPanels from '../features/home/ActivityPanels.jsx'
import Leaderboard from '../features/home/Leaderboard.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { SkeletonRows } from '../components/Skeleton.jsx'
import { useToast } from '../components/FeedbackProvider.jsx'
import './HomePage.css'

// One goal card per skill, coloured like the wireframe
const GOAL_CARDS = [
  { key: 'reading', label: 'Reading', letter: 'R' },
  { key: 'listening', label: 'Listening', letter: 'L' },
  { key: 'overall', label: 'Overall', letter: 'O' },
]

// Home page (US46, US42): target bands and exam date, latest band against the goal,
// a chart of bands over time, unfinished attempts to continue and the last few results.
export default function HomePage() {
  const { user } = useAuth()
  const [recent, setRecent] = useState([])
  const [unfinished, setUnfinished] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([listMyAttempts({ status: 'submitted', limit: 20 }), listMyAttempts({ status: 'in_progress', limit: 5 })])
      .then(([submitted, inProgress]) => {
        setRecent(submitted.items)
        setUnfinished(inProgress.items)
      })
      .catch((loadError) => setError(getErrorMessage(loadError)))
      .finally(() => setIsLoading(false))
  }, [])

  const goals = user.goals ?? {}
  const bands = latestBands(recent)
  const daysLeft = daysUntil(user.examDate)

  return (
    <main className="page home-page">
      <div className="page-heading">
        <h1>Chào {user.name}, hôm nay {todayLabel()}</h1>
        <p className="page-subtitle">Tiếp tục giữ nhịp luyện đề mỗi ngày.</p>
      </div>
      {error && <p className="library-message error">{error}</p>}

      <div className="home-top">
        <section className="home-panel">
          <div className="home-panel-header">
            <h2>Mục tiêu của bạn</h2>
            <button type="button" className="secondary-button" onClick={() => setIsEditing(true)}>
              {goals.overall || goals.reading || goals.listening ? 'Sửa mục tiêu' : 'Đặt mục tiêu'}
            </button>
          </div>

          <div className="home-cards">
            {GOAL_CARDS.map((card) => {
              const current = card.key === 'overall' ? overallBand(bands) : bands[card.key]
              const goal = goals[card.key]
              return (
                <div key={card.key} className={`home-card ${card.key}`}>
                  <p className="home-card-label">
                    <span className="home-card-letter">{card.letter}</span> {card.label}
                  </p>
                  <div className="home-card-numbers">
                    <div>
                      <small>Mục tiêu</small>
                      <strong className="home-card-goal">{goal ? goal.toFixed(1) : '—'}</strong>
                    </div>
                    <div>
                      <small>Hiện tại</small>
                      <strong>{current !== null ? current.toFixed(1) : '—'}</strong>
                    </div>
                  </div>
                  <p className="home-card-note">{gapText(current, goal)}</p>
                  <div className="home-card-bar">
                    <span style={{ width: `${goalProgress(current, goal)}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
          <p className="home-hint">“Hiện tại” lấy từ lần làm full đề gần nhất của mỗi kỹ năng; Overall là trung bình Reading và Listening.</p>
        </section>

        <section className="home-panel">
          <div className="home-panel-header">
            <h2>Lịch thi</h2>
          </div>
          <div className="home-exam">
            <button type="button" className="home-exam-box" onClick={() => setIsEditing(true)} title="Đổi ngày thi">
              <small>Ngày dự thi</small>
              <strong>{user.examDate ? new Date(user.examDate).toLocaleDateString('vi-VN') : 'Chưa đặt'}</strong>
              <span aria-hidden="true" className="home-exam-edit">✎</span>
            </button>
            <div className="home-exam-box soft">
              <small>Số ngày còn lại</small>
              <strong>{daysLeft !== null && daysLeft >= 0 ? `${daysLeft} ngày` : '—'}</strong>
            </div>
          </div>
          <p className="home-hint">{examLabel(daysLeft)}</p>
        </section>
      </div>

      <ActivityPanels />

      <Leaderboard />

      <div className="home-row">
        <section>
          <h2>Band theo thời gian</h2>
          {isLoading ? <SkeletonRows count={1} /> : <BandChart attempts={recent} goals={goals} />}
        </section>

        <section>
          <div className="home-goals-header">
            <h2>Kết quả gần đây</h2>
            <Link to="/history">Xem tất cả →</Link>
          </div>
          {isLoading ? (
            <SkeletonRows count={3} />
          ) : recent.length === 0 ? (
            <EmptyState title="Chưa có bài nào">
              <Link to="/library">Vào Kho đề để làm bài đầu tiên</Link>
            </EmptyState>
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

      </div>

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

      {isEditing && <GoalsDialog user={user} onClose={() => setIsEditing(false)} />}
    </main>
  )
}

function gapText(current, goal) {
  if (!goal) return 'Chưa đặt mục tiêu'
  if (current === null) return 'Chưa có band'
  const gap = gapLabel(current, goal)
  return gap === 'đạt mục tiêu' ? 'Đã đạt mục tiêu 🎉' : `${gap.charAt(0).toUpperCase()}${gap.slice(1)} band`
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
  const toast = useToast()
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
      toast('Đã lưu mục tiêu')
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
