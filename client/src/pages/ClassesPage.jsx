import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { listMyClasses, createClass, joinClass } from '../api/classes.js'
import { getErrorMessage } from '../api/errorMessages.js'
import { CLASS_COLORS, colorOf, studentCountLabel } from '../features/classes/classDisplay.js'
import './ClassesPage.css'

const TABS = [
  { label: 'Lớp tôi dạy', role: 'teacher' },
  { label: 'Lớp tôi học', role: 'student' },
]

// Classes page (US04, US06, US07): the classes I teach and the classes I study in.
export default function ClassesPage() {
  const navigate = useNavigate()
  const [role, setRole] = useState('teacher')
  const [classes, setClasses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [openDialog, setOpenDialog] = useState(null) // 'create' | 'join' | null

  useEffect(() => {
    setIsLoading(true)
    setError('')
    listMyClasses(role)
      .then(setClasses)
      .catch((loadError) => setError(getErrorMessage(loadError)))
      .finally(() => setIsLoading(false))
  }, [role])

  return (
    <main className="page">
      <div className="classes-header">
        <h1>Lớp học</h1>
        <div className="classes-actions">
          <button type="button" className="secondary-button" onClick={() => setOpenDialog('join')}>Nhập mã lớp</button>
          <button type="button" className="primary-button" onClick={() => setOpenDialog('create')}>+ Tạo lớp</button>
        </div>
      </div>

      <div className="library-tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.role}
            type="button"
            role="tab"
            aria-selected={role === tab.role}
            className={role === tab.role ? 'library-tab active' : 'library-tab'}
            onClick={() => setRole(tab.role)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <p className="library-message error">{error}</p>}
      {isLoading && <p className="library-message">Đang tải…</p>}
      {!isLoading && !error && classes.length === 0 && (
        <p className="library-message">
          {role === 'teacher' ? 'Bạn chưa dạy lớp nào. Bấm "+ Tạo lớp" để bắt đầu.' : 'Bạn chưa vào lớp nào. Hỏi giáo viên mã lớp rồi bấm "Nhập mã lớp".'}
        </p>
      )}

      <div className="classes-grid">
        {classes.map((item) => (
          <Link key={item.id} to={`/classes/${item.id}`} className="class-card">
            <div className="class-card-band" style={{ background: colorOf(item.color) }} />
            <div className="class-card-body">
              <h3>{item.name}</h3>
              {item.description && <p className="class-card-description">{item.description}</p>}
              <p className="class-card-meta">
                {item.myRole === 'teacher' ? studentCountLabel(item.studentCount) : `Giáo viên: ${item.teacherName ?? '—'}`}
              </p>
            </div>
          </Link>
        ))}
      </div>

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

// US04: name, short description and one of 5 colours
function CreateClassDialog({ onClose, onCreated }) {
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
      onCreated(await createClass({ name, description, color }))
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
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    try {
      onJoined(await joinClass(code))
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
