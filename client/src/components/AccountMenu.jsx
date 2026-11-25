import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { initialsOf } from './initials.js'
import './AccountMenu.css'

// Avatar in the navigation bar; clicking it opens a small menu with the account and US03 sign-out.
export default function AccountMenu() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const box = useRef(null)
  const { pathname } = useLocation()

  // Close after moving to another page
  useEffect(() => setIsOpen(false), [pathname])

  // Close when clicking anywhere else or pressing Esc
  useEffect(() => {
    if (!isOpen) return undefined
    const closeOnOutsideClick = (event) => !box.current?.contains(event.target) && setIsOpen(false)
    const closeOnEscape = (event) => event.key === 'Escape' && setIsOpen(false)
    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isOpen])

  function handleSignOut() {
    signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="account-menu" ref={box}>
      <button
        type="button"
        className="account-avatar"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Tài khoản"
      >
        {user.avatarUrl ? <img src={user.avatarUrl} alt="" referrerPolicy="no-referrer" /> : initialsOf(user.name)}
      </button>

      {isOpen && (
        <div className="account-dropdown">
          <p className="account-name">{user.name}</p>
          {user.isGuest ? (
            // A guest who signs out cannot come back to this account, so say so
            <p className="account-email">Tài khoản khách: đăng xuất sẽ mất dữ liệu đã làm. Đăng nhập Google ở trang Lớp học để giữ lại.</p>
          ) : (
            <p className="account-email">{user.email}</p>
          )}
          <button type="button" onClick={handleSignOut}>{user.isGuest ? 'Thoát chế độ khách' : 'Đăng xuất'}</button>
        </div>
      )}
    </div>
  )
}
