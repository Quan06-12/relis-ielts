import { useEffect, useState } from 'react'
import { listAssignments, getGradebook } from '../../api/classes.js'
import { teacherOverview, studentOverview } from './classOverview.js'

// Row of key numbers under the class header: for the teacher the class band, hand-in rate and
// next deadline; for a student what is left to do. Nothing is shown until the data arrives.
export default function ClassOverview({ classId, isTeacher, studentCount, refreshKey }) {
  const [tiles, setTiles] = useState(null)

  useEffect(() => {
    let isCurrent = true
    const loads = [listAssignments(classId), isTeacher ? getGradebook(classId) : Promise.resolve(null)]
    Promise.all(loads)
      .then(([assignments, gradebook]) => {
        if (!isCurrent) return
        setTiles(isTeacher ? teacherOverview({ assignments, gradebook, studentCount }) : studentOverview({ assignments }))
      })
      // The tabs below show their own errors; the summary just stays hidden
      .catch(() => isCurrent && setTiles(null))
    return () => {
      isCurrent = false
    }
  }, [classId, isTeacher, studentCount, refreshKey])

  if (!tiles) return null

  return (
    <section className={`class-overview cols-${tiles.length}`} aria-label="Tổng quan lớp">
      {tiles.map((tile) => (
        <div key={tile.key} className={`overview-tile ${tile.tone ?? ''}`}>
          <p className="overview-label">{tile.label}</p>
          <p className="overview-value">{tile.value}</p>
          <p className="overview-detail" title={tile.detail}>{tile.detail}</p>
        </div>
      ))}
    </section>
  )
}
