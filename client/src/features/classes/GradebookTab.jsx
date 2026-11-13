import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getGradebook } from '../../api/classes.js'
import { getErrorMessage } from '../../api/errorMessages.js'
import { formatScore } from './classDisplay.js'

// "Gradebook" tab, teacher only (US40): one row per student, one column per class test.
// A score links to the review page of that attempt (read-only for the teacher).
export default function GradebookTab({ classId }) {
  const [gradebook, setGradebook] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getGradebook(classId)
      .then(setGradebook)
      .catch((loadError) => setError(getErrorMessage(loadError)))
  }, [classId])

  if (error) return <p className="library-message error">{error}</p>
  if (!gradebook) return <p className="library-message">Đang tải…</p>
  if (gradebook.rows.length === 0) return <p className="library-message">Lớp chưa có học viên. Gửi mã lớp cho học viên để họ vào lớp.</p>
  if (gradebook.tests.length === 0) return <p className="library-message">Lớp chưa có đề nào trong kho đề lớp.</p>

  return (
    <div className="gradebook-scroll">
      <table className="gradebook">
        <thead>
          <tr>
            <th scope="col">Học viên</th>
            {gradebook.tests.map((test) => (
              <th key={test.id} scope="col" title={test.skill}>{test.title}</th>
            ))}
            <th scope="col">Band TB</th>
          </tr>
        </thead>
        <tbody>
          {gradebook.rows.map((row) => (
            <tr key={row.student.id}>
              <th scope="row">{row.student.name}</th>
              {row.cells.map((cell, index) => (
                <td key={gradebook.tests[index].id}>
                  {cell ? (
                    <Link to={`/attempts/${cell.attemptId}/review`}>{formatScore(cell)}</Link>
                  ) : (
                    <span className="empty-cell">—</span>
                  )}
                </td>
              ))}
              <td>{row.averageBand !== null ? row.averageBand.toFixed(1) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
