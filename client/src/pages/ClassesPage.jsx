import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { listMyClasses, createClass, joinClass } from '../api/classes.js'
import { getErrorMessage } from '../api/errorMessages.js'
import { CLASS_COLORS, colorOf, nextDueBox, splitByRole } from '../features/classes/classDisplay.js'
import { initialsOf } from '../components/initials.js'
import { SkeletonCards } from '../components/Skeleton.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { useToast } from '../components/FeedbackProvider.jsx'
import { useAuth } from '../auth/AuthContext.jsx'
import GuestClassesNotice from '../features/classes/GuestClassesNotice.jsx'
import './ClassesPage.css'

const TABS = [
  { label: 'Tất cả', key: 'all' },
  { label: 'Lớp tôi dạy', key: 'teaching' },
  { label: 'Lớp tôi học', key: 'studying' },
]

// Classes page (US04, US06, US07): the classes I teach and the classes I study in (not for guests).
// One account can teach one class and study in another, so both lists load together
// and the tabs only filter on the client.
export default function ClassesPage() {
  const { user } = useAuth()
  // A guest cannot create or join classes: show how to get a real account instead
  if (user?.isGuest) {
    return (
      <main className="page">
        <div className="page-heading">
          <h1>Lớp học</h1>
        </div>
        <GuestClassesNotice />
      </main>
    )
  }
  return <ClassesList />
}

function ClassesList() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [classes, setClasses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [openDialog, setOpenDialog] = useState(null) // 'create' | 'join' | null

  useEffect(() => {
    listMyClasses()
      .then(setClasses)
      .catch((loadError) => setError(getErrorMessage(loadError)))
      .finally(() => setIsLoading(false))
  }, [])

  const keyword = search.trim().toLowerCase()
  const matching = classes.filter((item) => item.name.toLowerCase().includes(keyword))
  const { teaching, studying } = splitByRole(matching)
  const counts = { all: matching.length, teaching: teaching.length, studying: studying.length }

  return (
    <main className="page">
      <div className="classes-header">
        <div className="page-heading">
          <h1>Lớp học</h1>
          <p className="page-subtitle">Một tài khoản có thể dạy lớp này và học lớp khác.</p>
        </div>
        <div className="classes-actions">
          <button type="button" className="secondary-button" onClick={() => setOpenDialog('join')}>Tham gia bằng mã</button>
          <button type="button" className="primary-button" onClick={() => setOpenDialog('create')}>+ Tạo lớp</button>
        </div>
      </div>

      <div className="classes-toolbar">
        <div className="segmented" role="tablist">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={tab === item.key}
              className={tab === item.key ? 'segmented-tab active' : 'segmented-tab'}
              onClick={() => setTab(item.key)}
            >
              {item.label} <span className="segmented-count">{counts[item.key]}</span>
            </button>
          ))}
        </div>
        <input
          type="search"
          className="classes-search"
          placeholder="Tìm theo tên lớp"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Tìm theo tên lớp"
        />
      </div>

      {error && <p className="library-message error">{error}</p>}
      {isLoading && <SkeletonCards />}
      {!isLoading && !error && classes.length === 0 && (
        <EmptyState kind="classes" title="Bạn chưa có lớp nào">
          Bấm &quot;+ Tạo lớp&quot; để dạy một lớp, hoặc &quot;Tham gia bằng mã&quot; với mã 6 ký tự giáo viên gửi.
        </EmptyState>
      )}

      {!isLoading && tab !== 'studying' && teaching.length > 0 && (
        <ClassSection title="Lớp tôi dạy" classes={teaching} />
      )}
      {!isLoading && tab !== 'teaching' && studying.length > 0 && (
        <ClassSection title="Lớp tôi học" classes={studying} />
      )}
      {!isLoading && classes.length > 0 && counts[tab] === 0 && (
        <p className="library-message">Không có lớp nào khớp.</p>
      )}

      {openDialog === 'create' && (
        <CreateClassDialog
          onClose={() => setOpenDialog(null)}
          onCreated={(newClass) => navigate(`/classes/${newClass.id}`)}
        />
      )}
      {openDialog === 'join' && (
        <JoinClassDialog
          onClose={() => setOpenDialog(null)}
          onJoined={(joinedClass) => navigate(`/classes/${joinedClass.id}`)}
        />
      )}
    </main>
  )
}

function ClassSection({ title, classes }) {
  return (
    <section className="classes-section">
      <h2>
        {title} <span>· {classes.length} lớp</span>
      </h2>
      <div className="classes-grid">
        {classes.map((item) =>
          item.myRole === 'teacher' ? <TeacherClassCard key={item.id} item={item} /> : <StudentClassCard key={item.id} item={item} />,
        )}
      </div>
    </section>
  )
}

// Coloured top of a card: role chip, name, description
function ClassCardHeader({ item }) {
  return (
    <div className="class-card-head" style={{ background: colorOf(item.color) }}>
      <span className="class-card-chip">{item.myRole === 'teacher' ? 'Bạn dạy' : 'Bạn học'}</span>
      <h3>{item.name}</h3>
      {item.description && <p>{item.description}</p>}
    </div>
  )
}

// Teacher card: students, open assignments, submissions in the last 7 days, and the class code
function TeacherClassCard({ item }) {
  const toast = useToast()

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(item.code)
      toast(`Đã chép mã ${item.code}`)
    } catch {
      toast('Không chép được, hãy chép mã bằng tay', 'error')
    }
  }

  return (
    <article className="class-card">
      <ClassCardHeader item={item} />
      <div className="class-card-body">
        <div className="class-stats">
          <div><strong>{item.studentCount ?? 0}</strong><small>học viên</small></div>
          <div><strong>{item.openAssignmentCount ?? 0}</strong><small>bài đang mở</small></div>
          <div className={item.recentSubmissionCount > 0 ? 'highlight' : ''}>
            <strong>{item.recentSubmissionCount ?? 0}</strong><small>bài mới nộp</small>
          </div>
        </div>
        <div className="class-code-row">
          Mã lớp <code>{item.code}</code>
          <button type="button" className="class-copy-button" onClick={copyCode}>Chép mã</button>
        </div>
        <Link to={`/classes/${item.id}`} className="class-enter">Vào lớp →</Link>
      </div>
    </article>
  )
}

// Student card: teacher, the next deadline, and how many assignments are submitted
function StudentClassCard({ item }) {
  const due = nextDueBox(item.nextDue)
  const total = item.assignmentCount ?? 0
  const submitted = item.submittedCount ?? 0

  return (
    <article className="class-card">
      <ClassCardHeader item={item} />
      <div className="class-card-body">
        <p className="class-teacher">
          <span className="class-teacher-avatar">{initialsOf(item.teacherName)}</span>
          Giáo viên: <strong>{item.teacherName ?? '—'}</strong>
        </p>
        <div className={`class-due ${due.tone}`}>
          <strong>{due.heading}</strong>
          <span>{due.detail}</span>
        </div>
        <div className="class-progress-label">
          <span>Đã nộp</span>
          <span><strong>{submitted}</strong> / {total} bài</span>
        </div>
        <div className="class-progress">
          <span style={{ width: total === 0 ? 0 : `${Math.round((submitted / total) * 100)}%` }} />
        </div>
        <Link to={`/classes/${item.id}`} className="class-enter">Vào lớp →</Link>
      </div>
    </article>
  )
}

// US04: name, short description and one of 5 colours
function CreateClassDialog({ onClose, onCreated }) {
  const toast = useToast()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('purple')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    try {
      const newClass = await createClass({ name, description, color })
      toast(`Đã tạo lớp ${newClass.name}`)
      onCreated(newClass)
    } catch (createError) {
      setError(getErrorMessage(createError))
      setIsSaving(false)
    }
  }

  return (
    <Dialog onClose={onClose}>
      <form onSubmit={handleSubmit} className="class-form">
        <h2>Tạo lớp</h2>
        <label>
          Tên lớp
          <input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} required autoFocus />
        </label>
        <label>
          Mô tả (không bắt buộc)
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={300} rows={2} />
        </label>
        <fieldset className="class-colors">
          <legend>Màu</legend>
          {Object.entries(CLASS_COLORS).map(([colorName, hex]) => (
            <button
              key={colorName}
              type="button"
              className={color === colorName ? 'color-swatch selected' : 'color-swatch'}
              style={{ background: hex }}
              onClick={() => setColor(colorName)}
              aria-label={colorName}
              aria-pressed={color === colorName}
            />
          ))}
        </fieldset>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="dialog-actions">
          <button type="button" className="secondary-button" onClick={onClose}>Huỷ</button>
          <button type="submit" className="primary-button" disabled={isSaving || name.trim() === ''}>Tạo lớp</button>
        </div>
      </form>
    </Dialog>
  )
}

// US06: type the 6-character code the teacher gave
function JoinClassDialog({ onClose, onJoined }) {
  const toast = useToast()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    try {
      const joinedClass = await joinClass(code)
      toast(`Đã vào lớp ${joinedClass.name}`)
      onJoined(joinedClass)
    } catch (joinError) {
      const isWrongCode = joinError.response?.status === 404
      setError(isWrongCode ? 'Không có lớp nào với mã này.' : getErrorMessage(joinError))
    }
  }

  return (
    <Dialog onClose={onClose}>
      <form onSubmit={handleSubmit} className="class-form">
        <h2>Nhập mã lớp</h2>
        <label>
          Mã lớp (6 ký tự)
          <input
            className="class-code-input"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            maxLength={8}
            required
            autoFocus
          />
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="dialog-actions">
          <button type="button" className="secondary-button" onClick={onClose}>Huỷ</button>
          <button type="submit" className="primary-button" disabled={code.trim().length < 6}>Vào lớp</button>
        </div>
      </form>
    </Dialog>
  )
}

function Dialog({ children, onClose }) {
  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}
