import { useCallback, useEffect, useState } from 'react'
import { listClassLibrary, addToClassLibrary, removeFromClassLibrary } from '../../api/classes.js'
import { listShareableTests } from '../../api/tests.js'
import { getErrorMessage } from '../../api/errorMessages.js'
import ModeDialog from '../attempt/ModeDialog.jsx'
import { useConfirm, useToast } from '../../components/FeedbackProvider.jsx'
import { SkeletonRows } from '../../components/Skeleton.jsx'

const SKILL_LABEL = { reading: 'Reading', listening: 'Listening' }

// "Class library" tab (US21, US22): every member can take the tests;
// the teacher can also add tests from their own library and remove them.
export default function ClassLibraryTab({ classId, isTeacher }) {
  const [tests, setTests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [testToStart, setTestToStart] = useState(null)
  const [isAdding, setIsAdding] = useState(false)
  const confirm = useConfirm()
  const toast = useToast()

  const load = useCallback(() => {
    setIsLoading(true)
    listClassLibrary(classId)
      .then(setTests)
      .catch((loadError) => setError(getErrorMessage(loadError)))
      .finally(() => setIsLoading(false))
  }, [classId])

  useEffect(load, [load])

  async function handleRemove(test) {
    const isSure = await confirm({
      title: 'Gỡ đề khỏi lớp?',
      message: `"${test.title}" sẽ không còn trong kho đề lớp. Bài học viên đã làm vẫn được giữ.`,
      confirmLabel: 'Gỡ đề',
      danger: true,
    })
    if (!isSure) return
    try {
      await removeFromClassLibrary(classId, test.id)
      setTests((current) => current.filter((item) => item.id !== test.id))
      toast('Đã gỡ đề khỏi lớp')
    } catch (removeError) {
      setError(getErrorMessage(removeError))
    }
  }

  return (
    <section>
      {isTeacher && (
        <div className="class-library-toolbar">
          <button type="button" className="primary-button" onClick={() => setIsAdding(true)}>+ Thêm đề vào lớp</button>
        </div>
      )}

      {error && <p className="library-message error">{error}</p>}
      {isLoading && <SkeletonRows />}
      {!isLoading && tests.length === 0 && (
        <p className="library-message">
          {isTeacher ? 'Lớp chưa có đề nào. Bấm "+ Thêm đề vào lớp" để đưa đề đã xuất bản lên.' : 'Giáo viên chưa đưa đề nào lên lớp.'}
        </p>
      )}

      <ul className="class-test-list">
        {tests.map((test) => (
          <li key={test.id} className="class-test-row">
            <span className={`skill-dot ${test.skill}`} aria-hidden="true" />
            <div className="class-test-info">
              <h3>{test.title}</h3>
              <p>{SKILL_LABEL[test.skill]} · {test.questionCount} câu · {test.durationMin} phút</p>
            </div>
            {test.lastBand !== null && <span className="class-test-band" title="Band lần làm full gần nhất">{test.lastBand.toFixed(1)}</span>}
            <button type="button" className="primary-button" onClick={() => setTestToStart(test)}>Làm bài</button>
            {isTeacher && (
              <button type="button" className="secondary-button" onClick={() => handleRemove(test)}>Gỡ</button>
            )}
          </li>
        ))}
      </ul>

      {testToStart && <ModeDialog testId={testToStart.id} classId={classId} onClose={() => setTestToStart(null)} />}

      {isAdding && (
        <AddTestsDialog
          classId={classId}
          alreadyInClass={new Set(tests.map((test) => test.id))}
          onClose={() => setIsAdding(false)}
          onAdded={(count) => {
            setIsAdding(false)
            toast(`Đã thêm ${count} đề vào lớp`)
            load()
          }}
        />
      )}
    </section>
  )
}

// Pick some of my published tests, or system tests, that are not in the class yet
function AddTestsDialog({ classId, alreadyInClass, onClose, onAdded }) {
  const [publishedTests, setPublishedTests] = useState(null)
  const [chosen, setChosen] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    listShareableTests()
      .then(setPublishedTests)
      .catch((loadError) => setError(getErrorMessage(loadError)))
  }, [])

  const myTests = publishedTests && publishedTests.filter((test) => !alreadyInClass.has(test.id))

  function toggle(testId) {
    setChosen((current) => (current.includes(testId) ? current.filter((id) => id !== testId) : [...current, testId]))
  }

  async function handleAdd() {
    try {
      await addToClassLibrary(classId, chosen)
      onAdded(chosen.length)
    } catch (addError) {
      setError(getErrorMessage(addError))
    }
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <h2>Thêm đề vào lớp</h2>
        {!myTests && !error && <p>Đang tải kho đề…</p>}
        {myTests && myTests.length === 0 && <p>Không còn đề đã xuất bản nào để thêm. Chỉ đề đã xuất bản mới đưa lên lớp được.</p>}
        {myTests && myTests.length > 0 && (
          <div className="pick-list">
            {myTests.map((test) => (
              <label key={test.id}>
                <input type="checkbox" checked={chosen.includes(test.id)} onChange={() => toggle(test.id)} />
                {test.title} · {SKILL_LABEL[test.skill]}{test.isSystem ? ' · Đề Relis' : ''}
              </label>
            ))}
          </div>
        )}
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="dialog-actions">
          <button type="button" className="secondary-button" onClick={onClose}>Huỷ</button>
          <button type="button" className="primary-button" onClick={handleAdd} disabled={chosen.length === 0}>
            Thêm {chosen.length > 0 ? `${chosen.length} đề` : ''}
          </button>
        </div>
      </div>
    </div>
  )
}
