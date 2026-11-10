import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDashboard } from '../api/practice.js'
import { useAuth } from '../auth/AuthContext.jsx'
import { ErrorNotice, AttemptCard } from '../components/PracticeShared.jsx'

export default function HomePage() {
  const { user } = useAuth()
  const [data, setData] = useState(null),
    [error, setError] = useState(null),
    [reload, setReload] = useState(0)
  useEffect(() => {
    let alive = true
    setError(null)
    getDashboard()
      .then((d) => {
        if (alive) setData(d)
      })
      .catch((e) => {
        if (alive) setError(e)
      })
    return () => {
      alive = false
    }
  }, [reload])
  return (
    <main className="page practice">
      <div className="hero-panel">
        <div>
          <p className="eyebrow">Một bước nhỏ mỗi ngày</p>
          <h1>Chào {user.name}!</h1>
          <p>Luyện Reading và Listening, theo dõi kết quả của chính bạn.</p>
        </div>
        <Link className="button primary" to="/library">
          Chọn đề luyện tập
        </Link>
      </div>
      <ErrorNotice error={error} retry={() => setReload((n) => n + 1)} />
      {!data && !error && <p role="status">Đang tải tổng quan…</p>}
      {data && (
        <>
          <div className="card-grid stats">
            {[
              ['Reading', data.reading],
              ['Listening', data.listening],
              ['Overall', data.overall],
            ].map(([label, value]) => (
              <section className="panel" key={label}>
                <h2>{label}</h2>
                <strong className="band-value">{value?.toFixed(1) ?? '—'}</strong>
                <p className="muted">
                  {label === 'Overall'
                    ? 'Trung bình hai kỹ năng, làm tròn 0,5'
                    : 'Band của bài full có điểm gần nhất'}
                </p>
              </section>
            ))}
          </div>
          <div className="section-heading">
            <h2>Hoạt động gần đây</h2>
            <Link to="/history">Xem tất cả</Link>
          </div>
          <p className="muted">Đã nộp {data.submittedCount} bài.</p>
          {data.recent.map((a) => (
            <AttemptCard key={a.id} attempt={a} />
          ))}
          {data.recent.length === 0 && (
            <p className="panel">Chưa có bài làm. Chọn đề đầu tiên để bắt đầu.</p>
          )}
        </>
      )}
    </main>
  )
}
