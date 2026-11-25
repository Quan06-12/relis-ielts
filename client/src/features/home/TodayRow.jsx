import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listMyTests } from '../../api/tests.js'
import ModeDialog from '../attempt/ModeDialog.jsx'
import { pickSuggestions } from './homeToday.js'
import { shortDeadline } from '../classes/assignmentDisplay.js'

const SKILL_LABEL = { reading: 'Reading', listening: 'Listening' }

// First row of the home page: what to do now. On the left the unfinished attempt to continue
// (or a nudge to the library), on the right a few system tests the user has not done yet.
export default function TodayRow({ unfinished }) {
  const [suggestions, setSuggestions] = useState(null)
  const [testToStart, setTestToStart] = useState(null)

  useEffect(() => {
    listMyTests({ source: 'system', done: 'false', limit: 20 })
      .then((page) => setSuggestions(pickSuggestions(page.items)))
      // Suggestions are a bonus: without them the row just shows the continue card
      .catch(() => setSuggestions([]))
  }, [])

  const current = unfinished[0] ?? null

  return (
    <div className="home-today">
      <section className="continue-card">
        {current ? (
          <>
            <p className="continue-eyebrow">Đang làm dở</p>
            <h2>{current.test?.title}</h2>
            <p className="continue-meta">
              {SKILL_LABEL[current.test?.skill] ?? ''} · bắt đầu lúc {shortDeadline(current.startedAt)}
              {unfinished.length > 1 ? ` · còn ${unfinished.length - 1} bài dở khác` : ''}
            </p>
            <Link to={`/attempts/${current.id}`} className="continue-button">Làm tiếp →</Link>
          </>
        ) : (
          <>
            <p className="continue-eyebrow">Bắt đầu hôm nay</p>
            <h2>Chưa có bài nào làm dở</h2>
            <p className="continue-meta">Chọn một đề gợi ý bên cạnh, hoặc vào Kho đề để xem tất cả.</p>
            <Link to="/library" className="continue-button">Vào Kho đề →</Link>
          </>
        )}
      </section>

      <section className="suggested">
        <div className="suggested-header">
          <h2>Đề gợi ý cho bạn</h2>
          <Link to="/library">Xem Kho đề Relis →</Link>
        </div>
        {suggestions && suggestions.length === 0 && <p className="home-hint">Bạn đã làm hết đề trong Kho đề Relis.</p>}
        <div className="suggested-list">
          {(suggestions ?? []).map((test) => (
            <button key={test.id} type="button" className={`suggested-card ${test.skill}`} onClick={() => setTestToStart(test)}>
              <span className="suggested-cover" style={test.coverUrl ? { backgroundImage: `url('${test.coverUrl}')` } : undefined}>
                <span className="suggested-kind">{test.kind === 'full' ? 'Full test' : 'Bài lẻ'}</span>
              </span>
              <span className="suggested-body">
                <strong title={test.title}>{test.title}</strong>
                <small>{SKILL_LABEL[test.skill]} · {test.durationMin} phút · {test.questionCount} câu</small>
              </span>
            </button>
          ))}
        </div>
      </section>

      {testToStart && <ModeDialog testId={testToStart.id} onClose={() => setTestToStart(null)} />}
    </div>
  )
}
