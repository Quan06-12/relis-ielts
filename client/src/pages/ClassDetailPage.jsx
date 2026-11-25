import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getClass, leaveClass } from '../api/classes.js'
import { getErrorMessage } from '../api/errorMessages.js'
import { colorOf, studentCountLabel } from '../features/classes/classDisplay.js'
import ClassLibraryTab from '../features/classes/ClassLibraryTab.jsx'
import GradebookTab from '../features/classes/GradebookTab.jsx'
import MembersTab from '../features/classes/MembersTab.jsx'
import AssignmentsTab from '../features/classes/AssignmentsTab.jsx'
import ClassOverview from '../features/classes/ClassOverview.jsx'
import SlideHighlight from '../components/SlideHighlight.jsx'
import { useConfirm, useToast } from '../components/FeedbackProvider.jsx'
import { SkeletonCards } from '../components/Skeleton.jsx'
import './ClassDetailPage.css'

// Class detail (US05, US21, US22, US40, US44, US45): class library and assignments for everyone,
// gradebook and members for teachers only.
export default function ClassDetailPage() {
  const { classId } = useParams()
  const navigate = useNavigate()
  const confirm = useConfirm()
  const toast = useToast()
  const [classInfo, setClassInfo] = useState(null)
  const [tab, setTab] = useState('assignments')
  const [isCreatingAssignment, setIsCreatingAssignment] = useState(false)
  // Bumped when an assignment is created, so the summary numbers reload
  const [overviewKey, setOverviewKey] = useState(0)
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
  if (!classInfo) {
    return (
      <main className="page">
        <SkeletonCards count={1} />
      </main>
    )
  }

  const isTeacher = classInfo.myRole === 'teacher'

  // US10: a student leaves; coming back needs the class code
  async function handleLeave() {
    const isSure = await confirm({
      title: `Rời lớp "${classInfo.name}"?`,
      message: 'Bạn sẽ không thấy bài của lớp nữa (bài đã nộp vẫn còn trong Lịch sử). Muốn vào lại cần mã lớp.',
      confirmLabel: 'Rời lớp',
      danger: true,
    })
    if (!isSure) return
    try {
      await leaveClass(classId)
      toast(`Đã rời lớp ${classInfo.name}`)
      navigate('/classes')
    } catch (leaveError) {
      setError(getErrorMessage(leaveError))
    }
  }

  function startAssignment() {
    setTab('assignments')
    setIsCreatingAssignment(true)
  }

  const tabs = [
    { id: 'assignments', label: 'Bài tập' },
    { id: 'library', label: 'Kho đề lớp' },
    ...(isTeacher ? [{ id: 'gradebook', label: 'Bảng điểm' }, { id: 'members', label: 'Thành viên' }] : []),
  ]

  return (
    <main className="page">
      <Link to="/classes" className="class-back">← Lớp học</Link>

      {/* The header uses the app's own navy; the class colour stays as a small dot in the chip */}
      <header className="class-hero">
        <div>
          <span className="class-hero-chip">
            <i className="class-color-dot" style={{ background: colorOf(classInfo.color) }} aria-hidden="true" />
            {isTeacher ? 'Bạn dạy lớp này' : 'Bạn học lớp này'}
          </span>
          <h1>{classInfo.name}</h1>
          <p className="class-hero-meta">
            {[classInfo.description, isTeacher ? studentCountLabel(classInfo.studentCount) : null].filter(Boolean).join(' · ')}
          </p>
        </div>
        {isTeacher ? (
          <div className="class-hero-actions">
            <ClassCode code={classInfo.code} />
            <button type="button" className="class-hero-button" onClick={startAssignment}>+ Giao bài</button>
          </div>
        ) : (
          <button type="button" className="class-hero-outline" onClick={handleLeave}>Rời lớp</button>
        )}
      </header>

      <ClassOverview classId={classId} isTeacher={isTeacher} studentCount={classInfo.studentCount} refreshKey={overviewKey} />

      <nav className="underline-tabs" role="tablist">
        <SlideHighlight variant="underline" activeKey={tab} />
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={tab === item.id ? 'underline-tab active' : 'underline-tab'}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* Names the open tab for screen readers and keeps headings in order (h1 → h2 → card h3) */}
      <h2 className="visually-hidden">{tabs.find((item) => item.id === tab)?.label}</h2>

      {tab === 'library' && <ClassLibraryTab classId={classId} isTeacher={isTeacher} />}
      {tab === 'assignments' && (
        <AssignmentsTab
          classId={classId}
          isTeacher={isTeacher}
          isCreating={isCreatingAssignment}
          onCreatingChange={(isOpen) => {
            setIsCreatingAssignment(isOpen)
            if (!isOpen) setOverviewKey((key) => key + 1)
          }}
          onShowResults={() => setTab('gradebook')}
        />
      )}
      {tab === 'gradebook' && <GradebookTab classId={classId} />}
      {tab === 'members' && <MembersTab classId={classId} />}
    </main>
  )
}

// US05: the teacher sees the code and copies it to send to students
function ClassCode({ code }) {
  const [isCopied, setIsCopied] = useState(false)
  const toast = useToast()

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code)
      toast('Đã sao chép mã lớp, gửi cho học viên để họ vào lớp')
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
      <button type="button" className="class-hero-outline small" onClick={handleCopy}>
        {isCopied ? 'Đã chép' : 'Chép mã'}
      </button>
    </div>
  )
}
