import { useEffect, useState } from 'react'
import { listMembers } from '../../api/classes.js'
import { getErrorMessage } from '../../api/errorMessages.js'

const ROLE_LABEL = { teacher: 'Giáo viên', student: 'Học viên' }

// "Members" tab, teacher only: who is in the class and since when
export default function MembersTab({ classId }) {
  const [members, setMembers] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    listMembers(classId)
      .then(setMembers)
      .catch((loadError) => setError(getErrorMessage(loadError)))
  }, [classId])

  if (error) return <p className="library-message error">{error}</p>
  if (!members) return <p className="library-message">Đang tải…</p>

  return (
    <ul className="member-list">
      {members.map((member) => (
        <li key={member.user.id} className="member-row">
          {member.user.avatarUrl ? (
            <img src={member.user.avatarUrl} alt="" referrerPolicy="no-referrer" />
          ) : (
            <span className="member-avatar" aria-hidden="true">{member.user.name.charAt(0).toUpperCase()}</span>
          )}
          <div className="member-info">
            <strong>{member.user.name}</strong>
            <p>{member.user.email} · vào lớp {new Date(member.joinedAt).toLocaleDateString('vi-VN')}</p>
          </div>
          <span className="role-chip">{ROLE_LABEL[member.role]}</span>
        </li>
      ))}
    </ul>
  )
}
