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

// My test library: start, edit, delete or share a test with my classes (US20, US21, US22).
export default function LibraryPage() {
  const [skill, setSkill] = useState('')
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
    listMyTests({ skill: skill || undefined, q: search || undefined, limit: 50 })
      .then((page) => setTests(page.items))
      .catch((loadError) => setError(getErrorMessage(loadError)))
      .finally(() => setIsLoading(false))
  }, [skill, search])

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

      {error && <p className="library-message error">{error}</p>}
      {isLoading && <p className="library-message">Đang tải…</p>}

      {!isLoading && !error && tests.length === 0 && (
        <p className="library-message">
          Chưa có đề nào. <Link to="/tests/new">Tạo đề đầu tiên</Link>
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
