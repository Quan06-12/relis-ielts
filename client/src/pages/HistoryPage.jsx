import { useEffect, useState } from 'react'
import SlideHighlight from '../components/SlideHighlight.jsx'
import { Link } from 'react-router-dom'
import { listMyAttempts, getActivity } from '../api/attempts.js'
import { getErrorMessage } from '../api/errorMessages.js'
import { groupByWeek, modeLabel, whenLabel, historyStats, durationLabel } from '../features/history/historyGroups.js'
import { toKey } from '../features/home/activityCalendar.js'
import ModeDialog from '../features/attempt/ModeDialog.jsx'
import { SkeletonCards } from '../components/Skeleton.jsx'
import EmptyState from '../components/EmptyState.jsx'
import './HistoryPage.css'

const PAGE_SIZE = 20
const SKILL_TABS = [
  { label: 'Tất cả', value: '' },
  { label: 'Reading', value: 'reading' },
  { label: 'Listening', value: 'listening' },
]
const SOURCE_TABS = [
  { label: 'Mọi nguồn', value: '' },
  { label: 'Tự luyện', value: 'self' },
  { label: 'Bài tập lớp', value: 'class' },
]

// History page (US39, wireframe): numbers for the last 30 days, unfinished attempts to continue,
// then every submitted attempt as a card, grouped by week, with filters.
export default function HistoryPage() {
  const [filters, setFilters] = useState({ skill: '', source: '', range: '30d', q: '' })
  const [attempts, setAttempts] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [testToRetake, setTestToRetake] = useState(null) // { testId, classId }

  // Changing a filter starts again from page 1; "Xem thêm" adds the next page below
  useEffect(() => {
    setIsLoading(true)
    setError('')
    const query = {
      status: 'submitted',
      skill: filters.skill || undefined,
      source: filters.source || undefined,
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
      <div className="page-heading">
        <h1>Lịch sử làm bài</h1>
        <p className="page-subtitle">Mọi lần làm bài của bạn, cả tự luyện lẫn bài tập lớp.</p>
      </div>

      <HistoryStats />
      <Unfinished />

      <div className="history-filters">
        <Segmented tabs={SKILL_TABS} value={filters.skill} onChange={(value) => changeFilter('skill', value)} />
        <Segmented tabs={SOURCE_TABS} value={filters.source} onChange={(value) => changeFilter('source', value)} />
        <select value={filters.range} onChange={(event) => changeFilter('range', event.target.value)} aria-label="Khoảng thời gian">
          <option value="7d">7 ngày qua</option>
          <option value="30d">30 ngày qua</option>
          <option value="all">Mọi lúc</option>
        </select>
        <input
          type="search"
          className="history-search"
          placeholder="Tìm theo tên đề"
          value={filters.q}
          onChange={(event) => changeFilter('q', event.target.value)}
          aria-label="Tìm theo tên đề"
        />
      </div>

      {error && <p className="library-message error">{error}</p>}
      {!isLoading && !error && attempts.length === 0 && (
        <EmptyState title="Chưa có bài nộp nào khớp">
          Thử đổi bộ lọc, hoặc <Link to="/library">vào Kho đề để làm bài</Link>.
        </EmptyState>
      )}

      {groupByWeek(attempts).map((group) => (
        <section key={group.label} className="history-group">
          <h2>{group.label}</h2>
          <ul className="history-grid">
            {group.items.map((attempt) => (
              <HistoryCard
                key={attempt.id}
                attempt={attempt}
                onRetake={() => setTestToRetake({ testId: attempt.test.id, classId: attempt.class?.id ?? null })}
              />
            ))}
          </ul>
        </section>
      ))}

      {isLoading && <SkeletonCards />}
      {!isLoading && attempts.length < total && (
        <button type="button" className="secondary-button history-more" onClick={() => setPage((current) => current + 1)}>
          Xem thêm
        </button>
      )}

      {testToRetake && <ModeDialog testId={testToRetake.testId} classId={testToRetake.classId} onClose={() => setTestToRetake(null)} />}
    </main>
  )
}

function Segmented({ tabs, value, onChange }) {
  return (
    <div className="segmented" role="tablist">
      <SlideHighlight activeKey={value} />
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={value === tab.value}
          className={value === tab.value ? 'segmented-tab active' : 'segmented-tab'}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

// Four tiles for the last 30 days: submissions, average Reading and Listening band, study time
function HistoryStats() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    const today = new Date()
    const monthAgo = new Date(today)
    monthAgo.setDate(monthAgo.getDate() - 29)
    Promise.all([listMyAttempts({ status: 'submitted', range: '30d', limit: 50 }), getActivity(toKey(monthAgo), toKey(today))])
      .then(([submitted, activity]) => setStats(historyStats(submitted.items, activity.days)))
      .catch(() => setStats(null)) // the tiles are extra; the list below still works without them
  }, [])

  if (!stats) return null

  const bandTile = (skill, label) => (
    <div className={`history-stat ${skill}`}>
      <small>{label}</small>
      <strong>{stats[skill].band !== null ? stats[skill].band.toFixed(1) : '—'}</strong>
      <span>{stats[skill].tests ? `từ ${stats[skill].tests} full test` : 'chưa có full test'}</span>
    </div>
  )

  return (
    <div className="history-stats">
      <div className="history-stat">
        <small>Số lần nộp</small>
        <strong>{stats.count}</strong>
        <span>30 ngày qua</span>
      </div>
      {bandTile('reading', 'Band Reading TB')}
      {bandTile('listening', 'Band Listening TB')}
      <div className="history-stat">
        <small>Thời gian luyện</small>
        <strong>{durationLabel(stats.minutes)}</strong>
        <span>30 ngày qua</span>
      </div>
    </div>
  )
}

// Attempts that were started but not submitted, with a button to continue
function Unfinished() {
  const [items, setItems] = useState([])

  useEffect(() => {
    listMyAttempts({ status: 'in_progress', limit: 5 })
      .then((result) => setItems(result.items))
      .catch(() => setItems([]))
  }, [])

  if (items.length === 0) return null

  return (
    <section className="history-unfinished">
      <h2>Đang làm dở</h2>
      {items.map((attempt) => (
        <div key={attempt.id} className="unfinished-card">
          <span className={`chip ${attempt.test?.skill ?? ''}`}>{attempt.test?.skill === 'listening' ? 'Listening' : 'Reading'}</span>
          <div className="unfinished-info">
            <strong>{attempt.test?.title ?? 'Đề đã bị xoá'} · {modeLabel(attempt).split(' · ')[1]}</strong>
            <span>Bắt đầu {whenLabel(attempt.startedAt).toLowerCase()}{attempt.class && ` · lớp ${attempt.class.name}`}</span>
          </div>
          <Link to={`/attempts/${attempt.id}`} className="primary-button">Tiếp tục</Link>
        </div>
      ))}
    </section>
  )
}

const ICONS = {
  reading: 'M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2zM4 21V5M8 7h6M8 11h6',
  listening: 'M3 18v-6a9 9 0 0 1 18 0v6M3 18a2 2 0 0 0 2 2h1v-6H5a2 2 0 0 0-2 2zm18 0a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2z',
}

function HistoryCard({ attempt, onRetake }) {
  const test = attempt.test
  const skill = test?.skill ?? 'reading'
  const result = attempt.result
  // Band when there is one; "Trống" for a blank attempt (it does not count); otherwise the correct count
  const ribbon =
    result?.band !== null && result?.band !== undefined
      ? result.band.toFixed(1)
      : result?.answered === 0
        ? 'Trống'
        : result
          ? `${result.correct}/${result.total}`
          : null

  return (
    <li className={`history-card ${skill}`}>
      <div className="history-cover" style={test?.coverUrl ? { backgroundImage: `url('${test.coverUrl}')` } : undefined}>
        <span className={attempt.class ? 'source-chip class' : 'source-chip'}>
          {attempt.class ? `Lớp ${attempt.class.name}` : 'Tự luyện'}
        </span>
        {ribbon && <span className="band-ribbon">{ribbon}</span>}
        {!test?.coverUrl && (
          <svg aria-hidden="true" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d={ICONS[skill]} />
          </svg>
        )}
        <span className="mode-tag">{modeLabel(attempt)}</span>
      </div>
      <div className="history-card-body">
        <h3>{test ? test.title : 'Đề đã bị xoá'}</h3>
        <p>{whenLabel(attempt.submittedAt ?? attempt.startedAt)}</p>
        <div className="history-actions">
          <button type="button" className="secondary-button" onClick={onRetake} disabled={!test}>Làm lại</button>
          <Link to={`/attempts/${attempt.id}/review`} className="primary-button">Xem lại</Link>
        </div>
      </div>
    </li>
  )
}
