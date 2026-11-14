import { useEffect, useState } from 'react'
import { listMembers, removeStudent } from '../../api/classes.js'
import { getErrorMessage } from '../../api/errorMessages.js'

const ROLE_LABEL = { teacher: 'Giáo viên', student: 'Học viên' }

// "Members" tab, teacher only: who is in the class and since when; students can be removed (US09)
export default function MembersTab({ classId }) {
  const [members, setMembers] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    listMembers(classId)
      .then(setMembers)
      .catch((loadError) => setError(getErrorMessage(loadError)))
  }, [classId])

  async function handleRemove(member) {
    const question = `Xoá ${member.user.name} khỏi lớp? Học viên sẽ không vào lớp được nữa, nhưng bài đã làm vẫn còn trong lịch sử của họ.`
    if (!window.confirm(question)) return
    try {
      await removeStudent(classId, member.user.id)
      setMembers((current) => current.filter((item) => item.user.id !== member.user.id))
    } catch (removeError) {
      setError(getErrorMessage(removeError))
    }
  }

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
          {member.role === 'student' && (
            <button type="button" className="secondary-button" onClick={() => handleRemove(member)}>Xoá</button>
          )}
        </li>
      ))}
    </ul>
  )
}
