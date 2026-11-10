import { useEffect, useState } from 'react'
import { listTests } from '../api/practice.js'
import { ErrorNotice } from '../components/PracticeShared.jsx'
import StartAttempt from '../components/StartAttempt.jsx'

export default function LibraryPage() {
  const [data, setData] = useState(null),
    [error, setError] = useState(null),
    [selected, setSelected] = useState(null)
  const [skill, setSkill] = useState(''),
    [query, setQuery] = useState(''),
    [page, setPage] = useState(1),
    [reload, setReload] = useState(0)
  useEffect(() => {
    let alive = true
    setError(null)
    setData(null)
    listTests({ skill: skill || undefined, q: query || undefined, page, limit: 12 })
      .then((d) => {
        if (alive) setData(d)
      })
      .catch((e) => {
        if (alive) setError(e)
      })
    return () => {
      alive = false
    }
  }, [skill, query, page, reload])
  return (
    <main className="page practice">
      <p className="eyebrow">Luyện tập mỗi ngày</p>
      <h1>Kho đề của bạn</h1>
      <p className="muted">Chọn một đề để bắt đầu hoặc tiếp tục bài đang làm.</p>
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
          Tìm theo tên
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(1)
            }}
          />
        </label>
      </div>
      <ErrorNotice error={error} retry={() => setReload((n) => n + 1)} />
      {!data && !error && <p role="status">Đang tải kho đề…</p>}
      {selected && (
        <StartAttempt key={selected} testId={selected} onClose={() => setSelected(null)} />
      )}
      <div className="card-grid">
        {data?.items.map((test) => (
          <article className="panel" key={test.id}>
            <span className="eyebrow">
              {test.skill} · {test.kind === 'full' ? 'Full test' : 'Đề lẻ'}
            </span>
            <h2>{test.title}</h2>
            <p className="muted">
              {test.questionCount} câu · {test.durationMin} phút
            </p>
            <button className="primary" onClick={() => setSelected(test.id)}>
              Chọn đề
            </button>
          </article>
        ))}
      </div>
      {data?.items.length === 0 && (
        <p className="panel">Chưa có đề phù hợp. API quản lý đề do thành viên A cung cấp.</p>
      )}
      {data && (
        <div className="pagination">
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>
            Trước
          </button>
          <span>Trang {page}</span>
          <button disabled={page * 12 >= data.total} onClick={() => setPage(page + 1)}>
            Sau
          </button>
        </div>
      )}
    </main>
  )
}
