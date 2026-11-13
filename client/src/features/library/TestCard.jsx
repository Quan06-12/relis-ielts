import { Link } from 'react-router-dom'
import './TestCard.css'

const SKILL_LABEL = { reading: 'Reading', listening: 'Listening' }
const KIND_LABEL = { full: 'Full test', single: 'Đề lẻ' }

// One test in the library grid: cover, band stamp, title and actions (US20, US22).
// onShare puts a published test in one or more class libraries (US21).
export default function TestCard({ test, onStart, onDelete, onShare }) {
  const canStart = test.questionCount > 0

  return (
    <article className="test-card">
      <div className={`test-card-cover ${test.skill}`} style={test.coverUrl ? { backgroundImage: `url('${test.coverUrl}')` } : undefined}>
        {!test.coverUrl && <span className="test-card-skill-mark">{SKILL_LABEL[test.skill]}</span>}
      </div>

      {/* Band stamp: only for tests the user finished as a full test */}
      {test.lastBand !== null && (
        <span className="band-stamp" title="Band lần làm full gần nhất">{test.lastBand.toFixed(1)}</span>
      )}

      <div className="test-card-body">
        <h3>{test.title}</h3>
        <p className="test-card-meta">
          {SKILL_LABEL[test.skill]} · {KIND_LABEL[test.kind]} · {test.questionCount} câu
          {test.status === 'draft' && <span className="draft-chip">Nháp</span>}
        </p>

        <div className="test-card-actions">
          <button type="button" className="primary-button" onClick={() => onStart(test)} disabled={!canStart}>
            Làm bài
          </button>
          <Link to={`/tests/${test.id}/edit`} className="secondary-button">Sửa</Link>
          {test.status === 'published' && (
            <button type="button" className="secondary-button" onClick={() => onShare(test)}>Đưa lên lớp</button>
          )}
          <button type="button" className="secondary-button danger" onClick={() => onDelete(test)}>Xoá</button>
        </div>
      </div>
    </article>
  )
}
