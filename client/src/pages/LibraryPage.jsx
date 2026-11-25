import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { listMyTests } from '../api/tests.js'
import { deleteTest } from '../api/testEditor.js'
import { getErrorMessage } from '../api/errorMessages.js'
import TestCard from '../features/library/TestCard.jsx'
import ModeDialog from '../features/attempt/ModeDialog.jsx'
import ShareToClassesDialog from '../features/classes/ShareToClassesDialog.jsx'
import { MENU, QUESTION_TYPE_LABELS, filterByQuestionType, questionTypesIn } from '../features/library/libraryFilters.js'
import { SkeletonCards } from '../components/Skeleton.jsx'
import TabSlider, { useTabSlider } from '../components/TabSlider.jsx'
import SlideHighlight from '../components/SlideHighlight.jsx'
import './LibraryPage.css'

const ICONS = {
  reading: 'M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2zM4 21V5M8 7h6M8 11h6',
  listening: 'M3 18v-6a9 9 0 0 1 18 0v6M3 18a2 2 0 0 0 2 2h1v-6H5a2 2 0 0 0-2 2zm18 0a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2z',
}

const SOURCES = [
  { value: 'system', label: 'Kho đề Relis' },
  { value: 'mine', label: 'Đề của tôi' },
]

// The test library (US20–US23): a switch between the system tests that come with Relis and my own tests,
// a menu on the left (Reading / Listening, single sections or full tests, question type),
// "not done / done" tabs and a search box on top, and the tests as cards.
export default function LibraryPage() {
  // System tests first, so a new user has something to practise right away
  const [source, setSource] = useState('system') // 'system' | 'mine'
  const [skill, setSkill] = useState('reading') // 'reading' | 'listening'
  const [kind, setKind] = useState('') // '' (all) | 'single' | 'full'
  const [questionType, setQuestionType] = useState('')
  const [done, setDone] = useState('false') // 'false' = Bài chưa làm, 'true' = Bài đã làm
  const [doneBar, doneBox] = useTabSlider(done)
  const [searchText, setSearchText] = useState('')
  const [search, setSearch] = useState('') // applied when "Tìm kiếm" is pressed
  const [tests, setTests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [testToStart, setTestToStart] = useState(null)
  const [testToDelete, setTestToDelete] = useState(null)
  const [testToShare, setTestToShare] = useState(null)
  const { user } = useAuth()
  // Admins add, edit and remove the tests of "Kho đề Relis" from its tab
  const manageSystem = user?.isAdmin === true && source === 'system'

  useEffect(() => {
    setIsLoading(true)
    setError('')
    // US23: every filter is sent together, so they combine
    listMyTests({ source, skill, kind: kind || undefined, done, q: search || undefined, limit: 50 })
      .then((page) => setTests(page.items))
      .catch((loadError) => setError(getErrorMessage(loadError)))
      .finally(() => setIsLoading(false))
  }, [source, skill, kind, done, search])

  function choose(nextSkill, nextKind) {
    setSkill(nextSkill)
    setKind(nextKind)
    setQuestionType('')
  }

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

  const shown = filterByQuestionType(tests, questionType)

  return (
    <main className="page library-page">
      <aside className="library-menu" aria-label="Lọc đề">
        <div className="source-switch" role="tablist" aria-label="Nguồn đề">
          <SlideHighlight activeKey={source} />
          {SOURCES.map((item) => (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={source === item.value}
              className={source === item.value ? 'source-tab active' : 'source-tab'}
              onClick={() => {
                setSource(item.value)
                setQuestionType('')
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
        {MENU.map((item) => {
          const isOpen = skill === item.skill
          return (
            <section key={item.skill} className={isOpen ? `menu-group open ${item.skill}` : `menu-group ${item.skill}`}>
              <button type="button" className="menu-group-head" aria-expanded={isOpen} onClick={() => choose(item.skill, '')}>
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={ICONS[item.skill]} />
                </svg>
                {item.label}
                <svg className="menu-caret" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {/* Always rendered so opening and closing can slide; hidden from keyboard when closed */}
              <div className="menu-collapse" inert={!isOpen}>
                <div className="menu-items">
                  <SlideHighlight variant="soft" activeKey={`${skill}-${kind}`} />
                  <button type="button" className={kind === '' ? 'menu-item active' : 'menu-item'} onClick={() => choose(item.skill, '')}>
                    <span className="menu-dot" aria-hidden="true" /> Tất cả đề
                  </button>
                  <button type="button" className={kind === 'single' ? 'menu-item active' : 'menu-item'} onClick={() => choose(item.skill, 'single')}>
                    <span className="menu-dot" aria-hidden="true" /> Bài lẻ ({item.partWord})
                  </button>
                  <label className="menu-select">
                    Loại câu hỏi:
                    <select value={questionType} onChange={(event) => setQuestionType(event.target.value)}>
                      <option value="">Tất cả</option>
                      {questionTypesIn(tests).map((type) => (
                        <option key={type} value={type}>{QUESTION_TYPE_LABELS[type] ?? type}</option>
                      ))}
                    </select>
                  </label>
                  <button type="button" className={kind === 'full' ? 'menu-item active' : 'menu-item'} onClick={() => choose(item.skill, 'full')}>
                    <span className="menu-dot" aria-hidden="true" /> Full đề
                  </button>
                </div>
              </div>
            </section>
          )
        })}
        <Link to={manageSystem ? '/tests/new?system=1' : '/tests/new'} className="menu-create">
          {manageSystem ? '+ Thêm đề vào Kho đề Relis' : '+ Tạo đề mới'}
        </Link>
      </aside>

      <div className="library-main">
        <div className="library-topbar">
          <div ref={doneBar} className="library-done-tabs" role="tablist" aria-label="Đã làm hay chưa">
            <TabSlider box={doneBox} className="done-slider" />
            {[
              { value: 'false', label: 'Bài chưa làm' },
              { value: 'true', label: 'Bài đã làm' },
            ].map((tab) => (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={done === tab.value}
                className={done === tab.value ? 'done-tab active' : 'done-tab'}
                onClick={() => setDone(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <form
            className="library-search"
            role="search"
            onSubmit={(event) => {
              event.preventDefault()
              setSearch(searchText.trim())
            }}
          >
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input type="search" placeholder="Tìm theo tên đề" value={searchText} onChange={(event) => setSearchText(event.target.value)} aria-label="Tìm theo tên đề" />
            <button type="submit">Tìm kiếm</button>
          </form>
        </div>


        {error && <p className="library-message error">{error}</p>}
        {isLoading && <SkeletonCards />}

        {!isLoading && !error && shown.length === 0 && (
          <p className="library-message">
            {done === 'true'
              ? 'Chưa có đề nào bạn đã làm trong mục này.'
              : source === 'system'
                ? 'Kho đề Relis chưa có đề nào trong mục này.'
                : <>Không có đề nào ở đây. <Link to="/tests/new">Tạo đề mới</Link></>}
          </p>
        )}

        {!isLoading && (
          <div className="library-grid">
            {shown.map((test) => (
              <TestCard key={test.id} test={test} showSystemChip={source !== 'system'} canManageSystem={manageSystem} onStart={setTestToStart} onDelete={setTestToDelete} onShare={setTestToShare} />
            ))}
          </div>
        )}
      </div>

      {testToStart && <ModeDialog testId={testToStart.id} onClose={() => setTestToStart(null)} />}
      {testToShare && <ShareToClassesDialog test={testToShare} onClose={() => setTestToShare(null)} />}

      {testToDelete && (
        <div className="dialog-backdrop" onClick={() => setTestToDelete(null)}>
          <div className="dialog" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <h2>{testToDelete.isSystem ? 'Gỡ đề khỏi Kho đề Relis?' : 'Xoá đề?'}</h2>
            <p>
              {testToDelete.isSystem
                ? <>Đề <strong>{testToDelete.title}</strong> sẽ không còn hiện với mọi người dùng. Các lần làm bài trước đó vẫn còn trong Lịch sử của họ.</>
                : <>Đề <strong>{testToDelete.title}</strong> sẽ bị xoá khỏi kho đề. Các lần làm bài trước đó vẫn còn trong Lịch sử.</>}
            </p>
            <div className="dialog-actions">
              <button type="button" className="secondary-button" onClick={() => setTestToDelete(null)}>Huỷ</button>
              <button type="button" className="primary-button danger" onClick={handleConfirmDelete}>{testToDelete.isSystem ? 'Gỡ đề' : 'Xoá đề'}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
