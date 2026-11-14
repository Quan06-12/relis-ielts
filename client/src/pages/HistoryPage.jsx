import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listMyAttempts } from '../api/attempts.js'
import { getErrorMessage } from '../api/errorMessages.js'
import { groupByWeek, scoreLabel } from '../features/history/historyGroups.js'
import { SkeletonRows } from '../components/Skeleton.jsx'
import EmptyState from '../components/EmptyState.jsx'
import './HistoryPage.css'

const PAGE_SIZE = 20
const SKILL_LABEL = { reading: 'Reading', listening: 'Listening' }
const STATUS_TABS = [
  { label: 'Tất cả', value: '' },
  { label: 'Đã nộp', value: 'submitted' },
  { label: 'Đang làm dở', value: 'in_progress' },
]

// History page (US39): every attempt, newest first, grouped by week, with filters.
export default function HistoryPage() {
  const [filters, setFilters] = useState({ status: '', skill: '', range: 'all', q: '' })
  const [attempts, setAttempts] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Changing a filter starts again from page 1; "Xem thêm" adds the next page below
  useEffect(() => {
    setIsLoading(true)
    setError('')
    const query = {
      status: filters.status || undefined,
      skill: filters.skill || undefined,
      range: filters.range,
      q: filters.q || undefined,
      page,
      limit: PAGE_SIZE,
    }
    listMyAttempts(query)
      .then((result) => {
        setAttempts((current) => (page === 1 ? result.items : [...current, ...result.items]))
        setTotal(result.total)
      })
      .catch((loadError) => setError(getErrorMessage(loadError)))
      .finally(() => setIsLoading(false))
  }, [filters, page])

  function changeFilter(name, value) {
    setPage(1)
    setFilters((current) => ({ ...current, [name]: value }))
  }

  return (
    <main className="page">
      <div className="library-header">
        <h1>Lịch sử làm bài</h1>
        <input
          type="search"
          className="library-search"
          placeholder="Tìm theo tên đề"
          value={filters.q}
          onChange={(event) => changeFilter('q', event.target.value)}
        />
      </div>

      <div className="history-filters">
        <div className="library-tabs" role="tablist">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={filters.status === tab.value}
              className={filters.status === tab.value ? 'library-tab active' : 'library-tab'}
              onClick={() => changeFilter('status', tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <select value={filters.skill} onChange={(event) => changeFilter('skill', event.target.value)} aria-label="Kỹ năng">
          <option value="">Mọi kỹ năng</option>
          <option value="reading">Reading</option>
          <option value="listening">Listening</option>
        </select>
        <select value={filters.range} onChange={(event) => changeFilter('range', event.target.value)} aria-label="Khoảng thời gian">
          <option value="7d">7 ngày qua</option>
          <option value="30d">30 ngày qua</option>
          <option value="all">Mọi lúc</option>
        </select>
      </div>

      {error && <p className="library-message error">{error}</p>}
      {!isLoading && !error && attempts.length === 0 && (
        <EmptyState title="Chưa có lần làm bài nào">
          Bài bạn làm sẽ hiện ở đây, xếp theo tuần. <Link to="/library">Vào Kho đề để làm bài</Link>
        </EmptyState>
      )}

      {groupByWeek(attempts).map((group) => (
        <section key={group.label} className="history-group">
          <h2>{group.label}</h2>
          <ul className="history-list">
            {group.items.map((attempt) => (
              <HistoryCard key={attempt.id} attempt={attempt} />
            ))}
          </ul>
        </section>
      ))}

      {isLoading && <SkeletonRows />}
      {!isLoading && attempts.length < total && (
        <button type="button" className="secondary-button history-more" onClick={() => setPage((current) => current + 1)}>
          Xem thêm
        </button>
      )}
    </main>
  )
}

function HistoryCard({ attempt }) {
  const isSubmitted = attempt.status === 'submitted'
  const test = attempt.test

  return (
    <li className="history-card">
      <span className={`skill-bar ${test?.skill ?? ''}`} aria-hidden="true" />
      <div className="history-info">
        <h3>{test ? test.title : 'Đề đã bị xoá'}</h3>
        <p>
          {test && SKILL_LABEL[test.skill]} · {attempt.mode.type === 'full' ? 'Full đề' : 'Từng phần'} ·{' '}
          {new Date(attempt.startedAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
          {attempt.class && <span className="class-chip">Lớp {attempt.class.name}</span>}
        </p>
      </div>
      {isSubmitted ? (
        <>
          <span className="history-score">{scoreLabel(attempt.result)}</span>
          <Link to={`/attempts/${attempt.id}/review`} className="secondary-button">Xem lại</Link>
        </>
      ) : (
        <Link to={`/attempts/${attempt.id}`} className="primary-button">Làm tiếp</Link>
      )}
    </li>
  )
}
