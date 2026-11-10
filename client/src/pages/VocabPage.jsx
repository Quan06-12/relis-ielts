import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { listVocab, createVocab } from '../api/practice.js'
import { ErrorNotice } from '../components/PracticeShared.jsx'

export default function VocabPage() {
  const navigate = useNavigate()
  const [data, setData] = useState(null),
    [title, setTitle] = useState(''),
    [error, setError] = useState(null),
    [busy, setBusy] = useState(false),
    [reload, setReload] = useState(0)
  useEffect(() => {
    let alive = true
    setError(null)
    listVocab()
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
  async function create(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const { set } = await createVocab({ title, words: [] })
      navigate(`/vocab/${set.id}`)
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }
  return (
    <main className="page practice">
      <p className="eyebrow">Ghi nhớ từ bạn gặp</p>
      <h1>Kho từ vựng</h1>
      <form className="panel inline-form" onSubmit={create}>
        <label>
          Tên bộ từ mới
          <input
            value={title}
            maxLength={120}
            required
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <button className="primary" disabled={busy || !title.trim()}>
          {busy ? 'Đang tạo…' : 'Tạo bộ từ'}
        </button>
      </form>
      <ErrorNotice error={error} retry={() => setReload((n) => n + 1)} />
      {!data && !error && <p role="status">Đang tải từ vựng…</p>}
      <div className="card-grid">
        {data?.items.map((set) => (
          <article className="panel" key={set.id}>
            <h2>{set.title}</h2>
            <p className="muted">{set.words.length} từ</p>
            <Link className="button secondary" to={`/vocab/${set.id}`}>
              Mở bộ từ
            </Link>
          </article>
        ))}
      </div>
      {data?.items.length === 0 && <p>Chưa có bộ từ. Tạo một bộ để ghi lại từ mới.</p>}
    </main>
  )
}
