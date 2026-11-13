import { useEffect, useState } from 'react'
import { listMyClasses, addToClassLibrary } from '../../api/classes.js'
import { getErrorMessage } from '../../api/errorMessages.js'

// "Put in class library" from my own library (US21): choose one or more classes I teach.
// The server has one endpoint per class, so the client calls it once for each chosen class.
export default function ShareToClassesDialog({ test, onClose }) {
  const [classes, setClasses] = useState(null)
  const [chosen, setChosen] = useState([])
  const [error, setError] = useState('')
  const [doneMessage, setDoneMessage] = useState('')

  useEffect(() => {
    listMyClasses('teacher')
      .then(setClasses)
      .catch((loadError) => setError(getErrorMessage(loadError)))
  }, [])

  function toggle(classId) {
    setChosen((current) => (current.includes(classId) ? current.filter((id) => id !== classId) : [...current, classId]))
  }

  async function handleShare() {
    setError('')
    try {
      await Promise.all(chosen.map((classId) => addToClassLibrary(classId, [test.id])))
      setDoneMessage(`Đã đưa đề lên ${chosen.length} lớp.`)
      setChosen([])
    } catch (shareError) {
      setError(getErrorMessage(shareError))
    }
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <h2>Đưa lên kho đề lớp</h2>
        <p><strong>{test.title}</strong></p>

        {!classes && !error && <p>Đang tải lớp…</p>}
        {classes && classes.length === 0 && <p>Bạn chưa dạy lớp nào. Tạo lớp ở trang Lớp học trước.</p>}
        {classes && classes.length > 0 && (
          <div className="pick-list">
            {classes.map((item) => (
              <label key={item.id}>
                <input type="checkbox" checked={chosen.includes(item.id)} onChange={() => toggle(item.id)} />
                {item.name}
              </label>
            ))}
          </div>
        )}

        {doneMessage && <p role="status">{doneMessage}</p>}
        {error && <p className="form-error" role="alert">{error}</p>}

        <div className="dialog-actions">
          <button type="button" className="secondary-button" onClick={onClose}>Đóng</button>
          <button type="button" className="primary-button" onClick={handleShare} disabled={chosen.length === 0}>Đưa lên</button>
        </div>
      </div>
    </div>
  )
}
