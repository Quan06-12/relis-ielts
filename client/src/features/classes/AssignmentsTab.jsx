import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listAssignments, createAssignment, deleteAssignment } from '../../api/classes.js'
import { listMyTests } from '../../api/tests.js'
import { getErrorMessage } from '../../api/errorMessages.js'
import ModeDialog from '../attempt/ModeDialog.jsx'
import { STATUS_LABEL, groupByStatus, timeLeftLabel, defaultDeadlineInput, assignmentChips, shortDeadline, averageLabel } from './assignmentDisplay.js'
import { formatScore } from './classDisplay.js'
import { useConfirm, useToast } from '../../components/FeedbackProvider.jsx'
import { SkeletonRows } from '../../components/Skeleton.jsx'

// "Assignments" tab: the teacher gives tests with a deadline (US44);
// a student sees their homework grouped by status, with their score (US45).
// The "+ Giao bài" button lives in the class header, so the page owns isCreating.
export default function AssignmentsTab({ classId, isTeacher, isCreating, onCreatingChange, onShowResults }) {
  const [assignments, setAssignments] = useState(null)
  const [error, setError] = useState('')
  const [assignmentToStart, setAssignmentToStart] = useState(null)
  const confirm = useConfirm()
  const toast = useToast()

  const load = useCallback(() => {
    listAssignments(classId)
      .then(setAssignments)
      .catch((loadError) => setError(getErrorMessage(loadError)))
  }, [classId])

  useEffect(load, [load])

  async function handleDelete(assignment) {
    const isSure = await confirm({
      title: 'Xoá bài tập?',
      message: `Bài tập "${assignment.test?.title}" sẽ bị xoá. Bài học viên đã làm vẫn được giữ.`,
      confirmLabel: 'Xoá bài tập',
      danger: true,
    })
    if (!isSure) return
    try {
      await deleteAssignment(classId, assignment.id)
      setAssignments((current) => current.filter((item) => item.id !== assignment.id))
      toast('Đã xoá bài tập')
    } catch (deleteError) {
      setError(getErrorMessage(deleteError))
    }
  }

  if (error) return <p className="library-message error">{error}</p>
  if (!assignments) return <SkeletonRows />

  return (
    <section>
      {assignments.length === 0 && (
        <p className="library-message">{isTeacher ? 'Chưa giao bài nào. Bấm "+ Giao bài" ở trên để giao đề có hạn nộp.' : 'Lớp chưa có bài tập nào.'}</p>
      )}

      {isTeacher ? (
        <ul className="assignment-list">
          {assignments.map((assignment) => {
            const total = assignment.studentCount ?? 0
            const average = averageLabel(assignment)
            return (
              <li key={assignment.id} className="assignment-card">
                <div className="assignment-main">
                  <Chips assignment={assignment} />
                  <h3>{assignment.test?.title ?? 'Đề đã bị xoá'}</h3>
                  <p>
                    Hạn: {shortDeadline(assignment.deadline)} · {timeLeftLabel(assignment.deadline)}
                    {assignment.allowLate && ' · cho nộp trễ'}
                  </p>
                </div>
                <div className="assignment-progress">
                  <div className="assignment-progress-label">
                    <span>Đã nộp</span>
                    <span><strong>{assignment.submittedCount}</strong> / {total}</span>
                  </div>
                  <div className="assignment-bar">
                    <span style={{ width: total === 0 ? 0 : `${Math.round((assignment.submittedCount / total) * 100)}%` }} />
                  </div>
                </div>
                <div className="assignment-average">
                  <strong>{average.value}</strong>
                  <small>{average.unit}</small>
                </div>
                <div className="assignment-actions">
                  <button type="button" className="link-button" onClick={onShowResults}>Xem kết quả →</button>
                  <button type="button" className="link-button muted" onClick={() => handleDelete(assignment)}>Xoá</button>
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        groupByStatus(assignments).map((group) => (
          <div key={group.status} className="assignment-group">
            <h3 className="assignment-group-title">{group.label} ({group.items.length})</h3>
            <ul className="assignment-list">
              {group.items.map((assignment) => (
                <li key={assignment.id} className="assignment-card">
                  <div className="assignment-main">
                    <Chips assignment={assignment} />
                    <h3>{assignment.test?.title ?? 'Đề đã bị xoá'}</h3>
                    <p>Hạn: {shortDeadline(assignment.deadline)} · {timeLeftLabel(assignment.deadline)}</p>
                  </div>
                  <span className={`assignment-status ${assignment.myStatus}`}>{STATUS_LABEL[assignment.myStatus]}</span>
                  <div className="assignment-actions">
                    <StudentAction assignment={assignment} onStart={() => setAssignmentToStart(assignment)} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}

      {assignmentToStart && (
        <ModeDialog
          testId={assignmentToStart.test.id}
          assignmentId={assignmentToStart.id}
          onClose={() => setAssignmentToStart(null)}
        />
      )}

      {isCreating && (
        <CreateAssignmentDialog
          classId={classId}
          onClose={() => onCreatingChange(false)}
          onCreated={() => {
            onCreatingChange(false)
            toast('Đã giao bài cho lớp')
            load()
          }}
        />
      )}
    </section>
  )
}

function Chips({ assignment }) {
  return (
    <div className="assignment-chips">
      {assignmentChips(assignment).map((chip) => (
        <span key={chip.label} className={`chip ${chip.tone}`}>{chip.label}</span>
      ))}
    </div>
  )
}

// What a student can do next on one assignment
function StudentAction({ assignment, onStart }) {
  switch (assignment.myStatus) {
    case 'todo':
      return <button type="button" className="primary-button" onClick={onStart}>Làm bài</button>
    case 'in_progress':
      return <Link to={`/attempts/${assignment.myAttemptId}`} className="primary-button">Làm tiếp</Link>
    case 'submitted':
    case 'late':
      return (
        <Link to={`/attempts/${assignment.myAttemptId}/review`} className="secondary-button">
          {formatScore(assignment.myResult)} · Xem lại
        </Link>
      )
    default:
      return null // missed: nothing to do any more
  }
}

// US44: pick one of my published tests, a deadline, and whether late work is accepted
function CreateAssignmentDialog({ classId, onClose, onCreated }) {
  const [tests, setTests] = useState(null)
  const [testId, setTestId] = useState('')
  const [deadline, setDeadline] = useState(defaultDeadlineInput())
  const [allowLate, setAllowLate] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    listMyTests({ status: 'published', limit: 50 })
      .then((page) => setTests(page.items))
      .catch((loadError) => setError(getErrorMessage(loadError)))
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    try {
      // datetime-local has no time zone; new Date() reads it as local time, toISOString() sends UTC
      await createAssignment(classId, { testId, deadline: new Date(deadline).toISOString(), allowLate })
      onCreated()
    } catch (createError) {
      setError(getErrorMessage(createError))
    }
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <form className="dialog class-form" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()} onSubmit={handleSubmit}>
        <h2>Giao bài</h2>
        <label>
          Đề
          <select value={testId} onChange={(event) => setTestId(event.target.value)} required>
            <option value="">{tests ? 'Chọn một đề đã xuất bản' : 'Đang tải…'}</option>
            {tests?.map((test) => (
              <option key={test.id} value={test.id}>{test.title}</option>
            ))}
          </select>
        </label>
        <label>
          Hạn nộp
          <input type="datetime-local" value={deadline} onChange={(event) => setDeadline(event.target.value)} required />
        </label>
        <label className="checkbox-label">
          <input type="checkbox" checked={allowLate} onChange={(event) => setAllowLate(event.target.checked)} />
          Cho nộp trễ (bài nộp sau hạn được đánh dấu trễ)
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="dialog-actions">
          <button type="button" className="secondary-button" onClick={onClose}>Huỷ</button>
          <button type="submit" className="primary-button" disabled={testId === ''}>Giao bài</button>
        </div>
      </form>
    </div>
  )
}
