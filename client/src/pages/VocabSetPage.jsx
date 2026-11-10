import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getVocab, updateVocab, deleteVocab } from '../api/practice.js'
import { ErrorNotice } from '../components/PracticeShared.jsx'

export default function VocabSetPage() {
  const { setId } = useParams(),
    navigate = useNavigate()
  const [set, setSet] = useState(null),
    [error, setError] = useState(null),
    [busy, setBusy] = useState(false),
    [saved, setSaved] = useState(false)
  const [card, setCard] = useState(0),
    [flipped, setFlipped] = useState(false),
    [confirmDelete, setConfirmDelete] = useState(false),
    [reload, setReload] = useState(0)
  useEffect(() => {
    let alive = true
    setError(null)
    getVocab(setId)
      .then((d) => {
        if (alive) setSet(d.set)
      })
      .catch((e) => {
        if (alive) setError(e)
      })
    return () => {
      alive = false
    }
  }, [setId, reload])
  function edit(next) {
    setSet(next)
    setSaved(false)
    setFlipped(false)
  }
  async function save(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const data = await updateVocab(setId, { title: set.title, words: set.words })
      setSet(data.set)
      setSaved(true)
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }
  async function remove() {
    setBusy(true)
    setError(null)
    try {
      await deleteVocab(setId)
      navigate('/vocab')
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }
  const word = set?.words[card]
  return (
    <main className="page practice">
      <Link to="/vocab">← Kho từ vựng</Link>
      <h1>Bộ từ của bạn</h1>
      <ErrorNotice error={error} retry={set ? undefined : () => setReload((n) => n + 1)} />
      {!set && !error && <p role="status">Đang đọc bộ từ…</p>}
      {set && (
        <>
          {word && (
            <section className="panel flashcard">
              <p className="muted">
                Ôn thẻ {card + 1}/{set.words.length}
              </p>
              <button
                className="flashcard-face"
                onClick={() => setFlipped(!flipped)}
                aria-label="Lật thẻ từ vựng"
              >
                {flipped ? word.meaning : word.term}
                <small>{flipped ? word.example : 'Bấm để xem nghĩa'}</small>
              </button>
              <div className="pagination">
                <button
                  disabled={card === 0}
                  onClick={() => {
                    setCard(card - 1)
                    setFlipped(false)
                  }}
                >
                  Thẻ trước
                </button>
                <button
                  disabled={card >= set.words.length - 1}
                  onClick={() => {
                    setCard(card + 1)
                    setFlipped(false)
                  }}
                >
                  Thẻ sau
                </button>
              </div>
            </section>
          )}
          <form className="panel vocab-editor" onSubmit={save}>
            <fieldset disabled={busy}>
              <legend>Chỉnh sửa bộ từ</legend>
              <label>
                Tên bộ từ
                <input
                  required
                  maxLength={120}
                  value={set.title}
                  onChange={(e) => edit({ ...set, title: e.target.value })}
                />
              </label>
              {set.words.map((w, i) => (
                <div className="word-row" key={i}>
                  {[
                    ['term', 'Từ', 200],
                    ['meaning', 'Nghĩa', 1000],
                    ['example', 'Ví dụ', 2000],
                  ].map(([field, label, max]) => (
                    <label key={field}>
                      {label}
                      <input
                        aria-label={`${label} ${i + 1}`}
                        required={field !== 'example'}
                        maxLength={max}
                        value={w[field]}
                        onChange={(e) =>
                          edit({
                            ...set,
                            words: set.words.map((old, index) =>
                              index === i ? { ...old, [field]: e.target.value } : old,
                            ),
                          })
                        }
                      />
                    </label>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      edit({ ...set, words: set.words.filter((_, index) => index !== i) })
                      setCard(0)
                    }}
                  >
                    Xóa từ {i + 1}
                  </button>
                </div>
              ))}
              <div className="form-actions">
                <button
                  type="button"
                  disabled={set.words.length >= 500}
                  onClick={() =>
                    edit({ ...set, words: [...set.words, { term: '', meaning: '', example: '' }] })
                  }
                >
                  Thêm từ
                </button>
                <button className="primary">{busy ? 'Đang lưu…' : 'Lưu bộ từ'}</button>
              </div>
            </fieldset>
            {saved && <p role="status">Đã lưu bộ từ.</p>}
          </form>
          <section className="panel">
            {confirmDelete ? (
              <>
                <p>Xóa bộ từ này vĩnh viễn?</p>
                <button disabled={busy} onClick={remove}>
                  Xác nhận xóa
                </button>
                <button onClick={() => setConfirmDelete(false)}>Hủy</button>
              </>
            ) : (
              <button onClick={() => setConfirmDelete(true)}>Xóa bộ từ</button>
            )}
          </section>
        </>
      )}
    </main>
  )
}
