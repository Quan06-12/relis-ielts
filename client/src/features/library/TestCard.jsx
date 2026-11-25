import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { QUESTION_TYPE_LABELS } from './libraryFilters.js'
import './TestCard.css'

const SKILL_LABEL = { reading: 'Reading', listening: 'Listening' }

// One test in the library (US20–US22): cover with time and question count, a coloured tag
// (Full test / Bài lẻ), the title, the question types, "Làm bài" and a ⋯ menu: continue the attempt
// in progress, review the latest result, edit, share, delete. A system test cannot be edited or deleted.
export default function TestCard({ test, onStart, onDelete, onShare, showSystemChip = true }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menu = useRef(null)
  const canStart = test.questionCount > 0

  // Close the ⋯ menu when clicking elsewhere or pressing Esc
  useEffect(() => {
    if (!isMenuOpen) return undefined
    const close = (event) => !menu.current?.contains(event.target) && setIsMenuOpen(false)
    const closeOnEscape = (event) => event.key === 'Escape' && setIsMenuOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isMenuOpen])

  return (
    <article className={`test-card ${test.skill}`}>
      <div className="test-card-cover" style={test.coverUrl ? { backgroundImage: `url('${test.coverUrl}')` } : undefined}>
        {!test.coverUrl && <span className="test-card-skill-mark">{SKILL_LABEL[test.skill]}</span>}
        {test.status === 'draft' && <span className="draft-chip">Nháp</span>}
        {/* Inside "Kho đề Relis" every card is a Relis test, so the chip only shows elsewhere */}
        {test.isSystem && showSystemChip && <span className="draft-chip system-chip">Đề Relis</span>}
        {/* Band stamp: only for tests the user finished as a full test */}
        {test.lastBand !== null && (
          <span className="band-stamp" title="Band lần làm full gần nhất">{test.lastBand.toFixed(1)}</span>
        )}
        <span className="kind-tag">{test.kind === 'full' ? 'Full test' : 'Bài lẻ'}</span>
      </div>

      <div className="test-card-body">
        <h3 title={test.title}>{test.title}</h3>
        <p className="test-card-meta">{test.durationMin} phút · {test.questionCount} câu</p>
        <ul className="test-card-types">
          {(test.questionTypes ?? []).slice(0, 3).map((type) => (
            <li key={type}>{QUESTION_TYPE_LABELS[type] ?? type}</li>
          ))}
          {(test.questionTypes ?? []).length === 0 && <li className="muted">Chưa có câu hỏi</li>}
        </ul>

        <div className="test-card-actions">
          <button type="button" className="primary-button" onClick={() => onStart(test)} disabled={!canStart}>
            Làm bài
          </button>
          <div className="card-menu" ref={menu}>
            <button type="button" className="card-menu-button" aria-label="Thêm thao tác" aria-expanded={isMenuOpen} onClick={() => setIsMenuOpen((open) => !open)}>
              ⋯
            </button>
            {isMenuOpen && (
              <div className="card-menu-list" role="menu">
                {test.openAttemptId && <Link role="menuitem" to={`/attempts/${test.openAttemptId}`}>Làm tiếp bài đang dở</Link>}
                {test.lastAttemptId && <Link role="menuitem" to={`/attempts/${test.lastAttemptId}/review`}>Xem lại bài làm gần nhất</Link>}
                {(test.openAttemptId || test.lastAttemptId) && <hr className="card-menu-divider" />}
                {!test.isSystem && <Link role="menuitem" to={`/tests/${test.id}/edit`}>Sửa đề</Link>}
                {test.status === 'published' && (
                  <button type="button" role="menuitem" onClick={() => { setIsMenuOpen(false); onShare(test) }}>Đưa lên lớp</button>
                )}
                {!test.isSystem && (
                  <button type="button" role="menuitem" className="danger" onClick={() => { setIsMenuOpen(false); onDelete(test) }}>Xoá đề</button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
