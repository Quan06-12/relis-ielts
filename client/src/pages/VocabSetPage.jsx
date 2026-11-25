import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getSet, updateSet, deleteSet, addWord, updateWord, deleteWord } from '../api/vocab.js'
import { getErrorMessage } from '../api/errorMessages.js'
import { WORD_TYPES, typeInfo, filterWords, wordForm } from '../features/vocab/vocabDisplay.js'
import { SkeletonRows } from '../components/Skeleton.jsx'
import Flashcards from '../features/vocab/Flashcards.jsx'
import { useConfirm, useToast } from '../components/FeedbackProvider.jsx'
import './VocabPage.css'

// One vocabulary set (US48, wireframe): a searchable table of words. Clicking a word slides a detail
// panel in from the right; "+ Thêm từ" and "Sửa từ" open the same panel as a form.
export default function VocabSetPage() {
  const { setId } = useParams()
  const navigate = useNavigate()
  const confirm = useConfirm()
  const toast = useToast()
  const [set, setSet] = useState(null)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [panel, setPanel] = useState(null) // { mode: 'view' | 'edit' | 'add', word }
  const [isReviewing, setIsReviewing] = useState(false)

  useEffect(() => {
    getSet(setId)
      .then(setSet)
      .catch((loadError) => setError(getErrorMessage(loadError)))
  }, [setId])

  if (error) {
    return (
      <main className="page">
        <p className="library-message error">{error}</p>
        <Link to="/vocab">← Về Kho từ vựng</Link>
      </main>
    )
  }
  if (!set) {
    return (
      <main className="page">
        <SkeletonRows />
      </main>
    )
  }

  const words = filterWords(set.words, search)

  async function handleRenameSet() {
    const name = window.prompt('Tên mới của bộ từ', set.name)
    if (name === null || name.trim() === '' || name.trim() === set.name) return
    try {
      setSet(await updateSet(set.id, { name }))
      toast('Đã đổi tên bộ từ')
    } catch (renameError) {
      toast(getErrorMessage(renameError), 'error')
    }
  }

  async function handleDeleteSet() {
    const isSure = await confirm({
      title: `Xoá bộ "${set.name}"?`,
      message: `Bộ từ và ${set.words.length} từ trong đó sẽ bị xoá, không khôi phục được.`,
      confirmLabel: 'Xoá bộ từ',
      danger: true,
    })
    if (!isSure) return
    try {
      await deleteSet(set.id)
      toast('Đã xoá bộ từ')
      navigate('/vocab')
    } catch (deleteError) {
      toast(getErrorMessage(deleteError), 'error')
    }
  }

  async function handleDeleteWord(word) {
    const isSure = await confirm({ title: `Xoá từ "${word.term}"?`, message: 'Từ này sẽ bị xoá khỏi bộ.', confirmLabel: 'Xoá từ', danger: true })
    if (!isSure) return
    try {
      await deleteWord(set.id, word.id)
      setSet((current) => ({ ...current, words: current.words.filter((item) => item.id !== word.id) }))
      setPanel(null)
      toast('Đã xoá từ')
    } catch (deleteError) {
      toast(getErrorMessage(deleteError), 'error')
    }
  }

  // After saving: put the word at the top (new) or in its place (edited), then show it
  function handleSaved(savedWord, isNew) {
    setSet((current) => ({
      ...current,
      words: isNew ? [savedWord, ...current.words] : current.words.map((item) => (item.id === savedWord.id ? savedWord : item)),
    }))
    setPanel({ mode: 'view', word: savedWord })
    toast(isNew ? `Đã thêm "${savedWord.term}"` : 'Đã lưu thay đổi')
  }

  return (
    <main className="page">
      <Link to="/vocab" className="class-back">← Kho từ vựng</Link>

      <div className="vocab-header">
        <div className="page-heading">
          <h1>{set.name}</h1>
          <p className="page-subtitle">{set.words.length} từ</p>
        </div>
        <div className="vocab-set-actions">
          <input type="search" className="vocab-search" placeholder="Tìm từ, nghĩa hoặc ghi chú" value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Tìm từ" />
          <button type="button" className="secondary-button" onClick={handleRenameSet}>Đổi tên</button>
          <button type="button" className="secondary-button danger-text" onClick={handleDeleteSet}>Xoá bộ</button>
          {set.words.length > 0 && (
            <button type="button" className="secondary-button review-button" onClick={() => setIsReviewing(true)}>Ôn bằng flashcard</button>
          )}
          <button type="button" className="primary-button" onClick={() => setPanel({ mode: 'add', word: null })}>+ Thêm từ</button>
        </div>
      </div>

      {set.words.length === 0 ? (
        <p className="library-message">Bộ này chưa có từ nào. Bấm &quot;+ Thêm từ&quot; để thêm từ đầu tiên.</p>
      ) : (
        <div className="vocab-table-wrap">
          <table className="vocab-table">
            <thead>
              <tr>
                <th>Từ vựng</th>
                <th>Nghĩa</th>
                <th>Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {words.map((word) => (
                <tr
                  key={word.id}
                  className={panel?.word?.id === word.id ? 'selected' : ''}
                  onClick={() => setPanel({ mode: 'view', word })}
                  tabIndex={0}
                  onKeyDown={(event) => event.key === 'Enter' && setPanel({ mode: 'view', word })}
                >
                  <td>
                    <strong>{word.term}</strong> <span className="type-tag">{typeInfo(word.type).short}</span>
                  </td>
                  <td>{word.meaning}</td>
                  <td className="vocab-note">{word.note || '—'}</td>
                </tr>
              ))}
              {words.length === 0 && (
                <tr>
                  <td colSpan={3} className="vocab-note">Không có từ nào khớp &quot;{search}&quot;.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {panel && (
        <div className="drawer-backdrop" onClick={() => setPanel(null)}>
          <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title" onClick={(event) => event.stopPropagation()}>
            {panel.mode === 'view' ? (
              <WordDetail word={panel.word} onClose={() => setPanel(null)} onEdit={() => setPanel({ mode: 'edit', word: panel.word })} onDelete={() => handleDeleteWord(panel.word)} />
            ) : (
              <WordForm setId={set.id} word={panel.word} onClose={() => setPanel(panel.word ? { mode: 'view', word: panel.word } : null)} onSaved={handleSaved} />
            )}
          </aside>
        </div>
      )}
      {isReviewing && <Flashcards words={set.words} setName={set.name} onClose={() => setIsReviewing(false)} />}
    </main>
  )
}

function WordDetail({ word, onClose, onEdit, onDelete }) {
  const blocks = [
    ['Ghi chú', word.note],
    ['Công thức động từ', word.type === 'v' ? word.verbForms : ''],
    ['Collocation', word.collocations],
    ['Câu ví dụ', word.example],
  ].filter(([, value]) => value)

  return (
    <>
      <div className="drawer-header">
        <button type="button" className="drawer-close" onClick={onClose} aria-label="Đóng">✕</button>
        <h2 id="drawer-title">Chi tiết từ vựng</h2>
      </div>
      <div className="drawer-body">
        <div className="word-title">
          <h3>{word.term}</h3>
          <span className="type-chip">{typeInfo(word.type).label}</span>
        </div>
        <p className="word-meaning">{word.meaning}</p>
        {blocks.map(([label, value]) => (
          <div key={label} className={label === 'Câu ví dụ' ? 'word-block example' : 'word-block'}>
            <small>{label}</small>
            <p>{value}</p>
          </div>
        ))}
      </div>
      <div className="drawer-footer">
        <button type="button" className="secondary-button danger-text" onClick={onDelete}>Xoá từ</button>
        <button type="button" className="primary-button" onClick={onEdit}>Sửa từ</button>
      </div>
    </>
  )
}

// US48: type, term and meaning (required), note, verb forms (verbs only), collocations, example
function WordForm({ setId, word, onClose, onSaved }) {
  const [form, setForm] = useState(wordForm(word))
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const change = (name) => (event) => setForm((current) => ({ ...current, [name]: event.target.value }))

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSaving(true)
    try {
      const saved = word ? await updateWord(setId, word.id, form) : await addWord(setId, form)
      onSaved(saved, !word)
    } catch (saveError) {
      setError(getErrorMessage(saveError))
      setIsSaving(false)
    }
  }

  return (
    <form className="word-form" onSubmit={handleSubmit}>
      <div className="drawer-header">
        <button type="button" className="drawer-close" onClick={onClose} aria-label="Đóng">✕</button>
        <h2 id="drawer-title">{word ? `Sửa "${word.term}"` : 'Thêm từ'}</h2>
      </div>
      <div className="drawer-body class-form">
        <label>
          Loại từ
          <select value={form.type} onChange={change('type')}>
            {WORD_TYPES.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </label>
        <label>
          Từ vựng *
          <input value={form.term} onChange={change('term')} maxLength={80} required autoFocus />
        </label>
        <label>
          Nghĩa *
          <input value={form.meaning} onChange={change('meaning')} maxLength={200} required />
        </label>
        {form.type === 'v' && (
          <label>
            Công thức động từ
            <input value={form.verbForms} onChange={change('verbForms')} placeholder="Ví dụ: go – went – gone" />
          </label>
        )}
        <label>
          Ghi chú
          <textarea rows={2} value={form.note} onChange={change('note')} />
        </label>
        <label>
          Collocation
          <input value={form.collocations} onChange={change('collocations')} placeholder="Ví dụ: sustainable development" />
        </label>
        <label>
          Câu ví dụ
          <textarea rows={2} value={form.example} onChange={change('example')} />
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
      </div>
      <div className="drawer-footer">
        <button type="button" className="secondary-button" onClick={onClose}>Huỷ</button>
        <button type="submit" className="primary-button" disabled={isSaving || form.term.trim() === '' || form.meaning.trim() === ''}>
          {isSaving ? 'Đang lưu…' : word ? 'Lưu thay đổi' : 'Thêm từ'}
        </button>
      </div>
    </form>
  )
}
