import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getClass } from '../api/classes.js'
import { getErrorMessage } from '../api/errorMessages.js'
import { colorOf, studentCountLabel } from '../features/classes/classDisplay.js'
import ClassLibraryTab from '../features/classes/ClassLibraryTab.jsx'
import GradebookTab from '../features/classes/GradebookTab.jsx'
import MembersTab from '../features/classes/MembersTab.jsx'
import AssignmentsTab from '../features/classes/AssignmentsTab.jsx'
import './ClassDetailPage.css'

// Class detail (US05, US21, US22, US40, US44, US45): class library and assignments for everyone,
// gradebook and members for teachers only.
export default function ClassDetailPage() {
  const { classId } = useParams()
  const [classInfo, setClassInfo] = useState(null)
  const [tab, setTab] = useState('library')
  const [error, setError] = useState('')

  useEffect(() => {
    getClass(classId)
      .then(setClassInfo)
      .catch((loadError) => setError(getErrorMessage(loadError)))
  }, [classId])

  if (error) {
    return (
      <main className="page">
        <p className="library-message error">{error}</p>
        <Link to="/classes">← Về trang Lớp học</Link>
      </main>
    )
  }
  if (!classInfo) return <main className="page">Đang tải lớp…</main>

  const isTeacher = classInfo.myRole === 'teacher'
  const tabs = [
    { id: 'library', label: 'Kho đề lớp' },
    { id: 'assignments', label: 'Bài tập' },
    ...(isTeacher ? [{ id: 'gradebook', label: 'Bảng điểm' }, { id: 'members', label: 'Thành viên' }] : []),
  ]

  return (
    <main className="page">
      <Link to="/classes" className="class-back">← Lớp học</Link>

      <header className="class-hero" style={{ background: colorOf(classInfo.color) }}>
        <div>
          <h1>{classInfo.name}</h1>
          {classInfo.description && <p>{classInfo.description}</p>}
          <p className="class-hero-meta">
            {isTeacher ? `Bạn là giáo viên · ${studentCountLabel(classInfo.studentCount)}` : 'Bạn là học viên'}
          </p>
        </div>
        {isTeacher && <ClassCode code={classInfo.code} />}
      </header>

      <nav className="library-tabs" role="tablist">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={tab === item.id ? 'library-tab active' : 'library-tab'}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {tab === 'library' && <ClassLibraryTab classId={classId} isTeacher={isTeacher} />}
      {tab === 'assignments' && <AssignmentsTab classId={classId} isTeacher={isTeacher} />}
      {tab === 'gradebook' && <GradebookTab classId={classId} />}
      {tab === 'members' && <MembersTab classId={classId} />}
    </main>
  )
}

// US05: the teacher sees the code and copies it to send to students
function ClassCode({ code }) {
  const [isCopied, setIsCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch {
      // Clipboard can be blocked (e.g. not https); the code is still on screen to copy by hand
    }
  }

  return (
    <div className="class-code">
      <span className="class-code-label">Mã lớp</span>
      <strong>{code}</strong>
      <button type="button" className="secondary-button" onClick={handleCopy}>
        {isCopied ? 'Đã sao chép' : 'Sao chép'}
      </button>
    </div>
  )
}
