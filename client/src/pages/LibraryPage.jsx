import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listMyTests } from '../api/tests.js'
import { deleteTest } from '../api/testEditor.js'
import { getErrorMessage } from '../api/errorMessages.js'
import TestCard from '../features/library/TestCard.jsx'
import ModeDialog from '../features/attempt/ModeDialog.jsx'
import ShareToClassesDialog from '../features/classes/ShareToClassesDialog.jsx'
import './LibraryPage.css'

const SKILL_TABS = [
  { label: 'Tất cả', value: '' },
  { label: 'Reading', value: 'reading' },
  { label: 'Listening', value: 'listening' },
]

const DONE_TABS = [
  { label: 'Tất cả', value: '' },
  { label: 'Chưa làm', value: 'false' },
  { label: 'Đã làm', value: 'true' },
]

// My test library: filter, start, edit, delete or share a test with my classes (US20–US23).
export default function LibraryPage() {
  const [skill, setSkill] = useState('')
  const [kind, setKind] = useState('') // '' | 'full' | 'single'
  const [done, setDone] = useState('') // '' | 'true' (Đã làm) | 'false' (Chưa làm)
  const [search, setSearch] = useState('')
  const [tests, setTests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [testToStart, setTestToStart] = useState(null)
  const [testToDelete, setTestToDelete] = useState(null)
  const [testToShare, setTestToShare] = useState(null)

  useEffect(() => {
    setIsLoading(true)
    setError('')
    // US23: every filter is sent together, so they combine
    listMyTests({ skill: skill || undefined, kind: kind || undefined, done: done || undefined, q: search || undefined, limit: 50 })
      .then((page) => setTests(page.items))
      .catch((loadError) => setError(getErrorMessage(loadError)))
      .finally(() => setIsLoading(false))
  }, [skill, kind, done, search])

  // US20: delete after confirming. A test someone already took is hidden by the server instead.
  async function handleConfirmDelete() {
    try {
      await deleteTest(testToDelete.id)
      setTests((current) => current.filter((test) => test.id !== testToDelete.id))
    } catch (deleteError) {
      setError(getErrorMessage(deleteError))
    } finally {
      setTestToDelete(null)
    }
  }

  return (
    <main className="page">
      <div className="library-header">
        <h1>Kho đề</h1>
        <input
          type="search"
          className="library-search"
          placeholder="Tìm theo tên đề"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="library-tabs" role="tablist">
        {SKILL_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={skill === tab.value}
            className={skill === tab.value ? 'library-tab active' : 'library-tab'}
            onClick={() => setSkill(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="library-filters">
        <div className="library-tabs" role="tablist" aria-label="Đã làm hay chưa">
          {DONE_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={done === tab.value}
              className={done === tab.value ? 'library-tab active' : 'library-tab'}
              onClick={() => setDone(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <select value={kind} onChange={(event) => setKind(event.target.value)} aria-label="Loại đề">
          <option value="">Mọi loại đề</option>
          <option value="full">Full đề</option>
          <option value="single">Đề lẻ</option>
        </select>
      </div>

      {error && <p className="library-message error">{error}</p>}
      {isLoading && <p className="library-message">Đang tải…</p>}

      {!isLoading && !error && tests.length === 0 && (
        <p className="library-message">
          {skill || kind || done || search ? 'Không có đề nào khớp bộ lọc.' : <>Chưa có đề nào. <Link to="/tests/new">Tạo đề đầu tiên</Link></>}
        </p>
      )}

      <div className="library-grid">
        {tests.map((test) => (
          <TestCard key={test.id} test={test} onStart={setTestToStart} onDelete={setTestToDelete} onShare={setTestToShare} />
        ))}
      </div>

      {testToStart && <ModeDialog testId={testToStart.id} onClose={() => setTestToStart(null)} />}
      {testToShare && <ShareToClassesDialog test={testToShare} onClose={() => setTestToShare(null)} />}

      {testToDelete && (
        <div className="dialog-backdrop" onClick={() => setTestToDelete(null)}>
          <div className="dialog" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <h2>Xoá đề?</h2>
            <p>
              Đề <strong>{testToDelete.title}</strong> sẽ bị xoá khỏi kho đề. Các lần làm bài trước đó vẫn còn trong
              Lịch sử.
            </p>
            <div className="dialog-actions">
              <button type="button" className="secondary-button" onClick={() => setTestToDelete(null)}>Huỷ</button>
              <button type="button" className="primary-button danger" onClick={handleConfirmDelete}>Xoá đề</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
