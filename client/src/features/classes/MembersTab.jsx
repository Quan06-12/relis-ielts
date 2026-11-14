import { useEffect, useState } from 'react'
import { listMembers, removeStudent } from '../../api/classes.js'
import { getErrorMessage } from '../../api/errorMessages.js'
import { useConfirm, useToast } from '../../components/FeedbackProvider.jsx'
import { SkeletonRows } from '../../components/Skeleton.jsx'

const ROLE_LABEL = { teacher: 'Giáo viên', student: 'Học viên' }

// "Members" tab, teacher only: who is in the class and since when; students can be removed (US09)
export default function MembersTab({ classId }) {
  const [members, setMembers] = useState(null)
  const [error, setError] = useState('')
  const confirm = useConfirm()
  const toast = useToast()

  useEffect(() => {
    listMembers(classId)
      .then(setMembers)
      .catch((loadError) => setError(getErrorMessage(loadError)))
  }, [classId])

  async function handleRemove(member) {
    const isSure = await confirm({
      title: `Xoá ${member.user.name} khỏi lớp?`,
      message: 'Học viên sẽ không vào lớp được nữa, nhưng bài đã làm vẫn còn trong lịch sử của họ.',
      confirmLabel: 'Xoá khỏi lớp',
      danger: true,
    })
    if (!isSure) return
    try {
      await removeStudent(classId, member.user.id)
      setMembers((current) => current.filter((item) => item.user.id !== member.user.id))
      toast(`Đã xoá ${member.user.name} khỏi lớp`)
    } catch (removeError) {
      setError(getErrorMessage(removeError))
    }
  }

  if (error) return <p className="library-message error">{error}</p>
  if (!members) return <SkeletonRows />

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
