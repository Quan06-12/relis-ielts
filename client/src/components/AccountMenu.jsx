import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import './AccountMenu.css'

// Avatar in the navigation bar; clicking it opens a small menu with the account and US03 sign-out.
export default function AccountMenu() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)

  function handleSignOut() {
    signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="account-menu">
      <button
        type="button"
        className="account-avatar"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Tài khoản"
      >
        {user.avatarUrl ? <img src={user.avatarUrl} alt="" referrerPolicy="no-referrer" /> : user.name.charAt(0)}
      </button>

      {isOpen && (
        <div className="account-dropdown">
          <p className="account-name">{user.name}</p>
          <p className="account-email">{user.email}</p>
          <button type="button" onClick={handleSignOut}>Đăng xuất</button>
        </div>
      )}
    </div>
  )
}
