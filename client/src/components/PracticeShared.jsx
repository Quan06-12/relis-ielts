import { Link } from 'react-router-dom'
import { getErrorMessage } from '../api/errorMessages.js'
import { formatDate } from '../practice/history.js'
export function ErrorNotice({ error, retry }) {
  if (!error) return null
  return (
    <div className="notice error" role="alert">
      <p>{getErrorMessage(error)}</p>
      {retry && <button onClick={retry}>Thử lại</button>}
    </div>
  )
}
export function ResultSummary({ result }) {
  if (!result) return null
  return (
    <div className="result-strip">
      <strong>
        {result.correct}/{result.total} câu đúng
      </strong>
      <span>
        Band: <b>{result.band ?? '—'}</b>
      </span>
      {result.band == null && (
        <small>Band chỉ có cho đề full 40 câu trong khoảng điểm đã quy định.</small>
      )}
    </div>
  )
}
export function AttemptCard({ attempt }) {
  return (
    <article className="panel attempt-card">
      <div>
        <span className="eyebrow">
          {attempt.skill} · {attempt.status === 'submitted' ? 'Đã nộp' : 'Đang làm'}
        </span>
        <h3>{attempt.title}</h3>
        <p className="muted">{formatDate(attempt.startedAt)}</p>
        <ResultSummary result={attempt.result} />
      </div>
      <Link
        className="button secondary"
        to={`/attempts/${attempt.id}${attempt.status === 'submitted' ? '/review' : ''}`}
      >
        {attempt.status === 'submitted' ? 'Xem lại' : 'Tiếp tục'}
      </Link>
    </article>
  )
}
