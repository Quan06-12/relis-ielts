import { useEffect, useState } from 'react'
import { listAttempts } from '../api/practice.js'
import { ErrorNotice, AttemptCard } from '../components/PracticeShared.jsx'
import { historyGroup } from '../practice/history.js'

export default function HistoryPage() {
  const [data, setData] = useState(null),
    [error, setError] = useState(null),
    [page, setPage] = useState(1)
  const [skill, setSkill] = useState(''),
    [status, setStatus] = useState(''),
    [reload, setReload] = useState(0)
  useEffect(() => {
    let alive = true
    setData(null)
    setError(null)
    listAttempts({ page, limit: 10, skill: skill || undefined, status: status || undefined })
      .then((d) => {
        if (alive) setData(d)
      })
      .catch((e) => {
        if (alive) setError(e)
      })
    return () => {
      alive = false
    }
  }, [page, skill, status, reload])
  return (
    <main className="page practice">
      <p className="eyebrow">Hành trình luyện tập</p>
      <h1>Lịch sử làm bài</h1>
      <div className="filters">
        <label>
          Kỹ năng
          <select
            value={skill}
            onChange={(e) => {
              setSkill(e.target.value)
              setPage(1)
            }}
          >
            <option value="">Tất cả</option>
            <option value="reading">Reading</option>
            <option value="listening">Listening</option>
          </select>
        </label>
        <label>
          Trạng thái
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
          >
            <option value="">Tất cả</option>
            <option value="submitted">Đã nộp</option>
            <option value="in_progress">Đang làm</option>
          </select>
        </label>
      </div>
      <ErrorNotice error={error} retry={() => setReload((n) => n + 1)} />
      {!data && !error && <p role="status">Đang tải lịch sử…</p>}
      {data?.items.length === 0 && <p className="panel">Chưa có bài làm phù hợp.</p>}
      {['Tuần này', 'Tuần trước', 'Trước đó'].map((group) => {
        const items = data?.items.filter((a) => historyGroup(a.startedAt) === group) || []
        return (
          items.length > 0 && (
            <section key={group}>
              <h2>{group}</h2>
              {items.map((a) => (
                <AttemptCard key={a.id} attempt={a} />
              ))}
            </section>
          )
        )
      })}
      {data && (
        <div className="pagination">
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>
            Trước
          </button>
          <span>
            Trang {page} · {data.total} bài
          </span>
          <button disabled={page * 10 >= data.total} onClick={() => setPage(page + 1)}>
            Sau
          </button>
        </div>
      )}
    </main>
  )
}
