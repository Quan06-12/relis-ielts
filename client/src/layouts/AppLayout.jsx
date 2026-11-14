import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import CubeLogo from '../components/CubeLogo.jsx'
import AccountMenu from '../components/AccountMenu.jsx'
import './AppLayout.css'

const tabs = [
  { label: 'Trang chủ', to: '/' },
  { label: 'Kho đề', to: '/library' },
  { label: 'Lớp học', to: '/classes' },
  { label: 'Từ vựng', to: '/vocab' },
  { label: 'Lịch sử', to: '/history' },
]

// Purple navigation bar shared by every page except the login, attempt and review pages.
// On narrow screens the tabs fold into a ☰ menu.
export default function AppLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { pathname } = useLocation()

  // Close the phone menu after moving to another page
  useEffect(() => setIsMenuOpen(false), [pathname])

  return (
    <>
      <header className="app-header">
        <nav className="app-nav">
          <button
            type="button"
            className="menu-button"
            aria-label={isMenuOpen ? 'Đóng menu' : 'Mở menu'}
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            {isMenuOpen ? '✕' : '☰'}
          </button>

          <Link to="/" className="app-logo">
            <CubeLogo />
            <span>Relis</span>
          </Link>

          <div className={isMenuOpen ? 'app-tabs open' : 'app-tabs'}>
            {tabs.map((tab) => (
              // `end` keeps "Trang chủ" from staying active on every page (all paths start with "/")
              <NavLink key={tab.to} to={tab.to} end={tab.to === '/'} className="app-tab">
                {tab.label}
              </NavLink>
            ))}
          </div>

          <div className="app-actions">
            <Link to="/tests/new" className="create-test-button">+ Tạo đề</Link>
            <AccountMenu />
          </div>
        </nav>
        <div className="app-nav-strip" />
      </header>

      <Outlet />
    </>
  )
}
