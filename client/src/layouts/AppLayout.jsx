import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import CubeLogo from '../components/CubeLogo.jsx'
import AccountMenu from '../components/AccountMenu.jsx'
import './AppLayout.css'

// Line icons from the wireframe (24×24, drawn with the text colour)
const tabs = [
  { label: 'Trang chủ', to: '/', icon: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z' },
  { label: 'Kho đề', to: '/library', icon: 'M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2zM4 21V5M8 7h6M8 11h6' },
  { label: 'Lớp học', to: '/classes', icon: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a6 6 0 0 1 12 0v1M16 3.5a4 4 0 0 1 0 7M22 21v-1a6 6 0 0 0-4-5.6' },
  { label: 'Từ vựng', to: '/vocab', icon: 'M4 5h8M8 3v2M5.5 5c.8 3 2.8 5.5 5.5 7M10.5 5c-.8 3.5-3 6.5-6.5 8M13 21l4-10 4 10M14.5 17.5h5' },
  { label: 'Lịch sử', to: '/history', icon: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2' },
]

// Purple navigation bar shared by every page except the login, attempt and review pages.
// On narrow screens the tabs fold into a ☰ menu.
export default function AppLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const createMenu = useRef(null)
  const { pathname } = useLocation()

  // Close the menus after moving to another page
  useEffect(() => {
    setIsMenuOpen(false)
    setIsCreateOpen(false)
  }, [pathname])

  // Close the "+ Tạo đề" menu when clicking anywhere else
  useEffect(() => {
    if (!isCreateOpen) return undefined
    function closeOnOutsideClick(event) {
      if (!createMenu.current?.contains(event.target)) setIsCreateOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [isCreateOpen])

  return (
    <>
      <header className="app-header">
        <nav className="app-nav" aria-label="Menu chính">
          <button
            type="button"
            className="menu-button"
            aria-label={isMenuOpen ? 'Đóng menu' : 'Mở menu'}
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            {isMenuOpen ? '✕' : '☰'}
          </button>

          <Link to="/" className="app-logo rl-spin" aria-label="Relis, về trang chủ">
            <CubeLogo size={20} />
            <span>Relis</span>
          </Link>

          <div className={isMenuOpen ? 'app-tabs open' : 'app-tabs'}>
            {tabs.map((tab) => (
              // `end` keeps "Trang chủ" from staying active on every page (all paths start with "/")
              <NavLink key={tab.to} to={tab.to} end={tab.to === '/'} className="app-tab">
                <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={tab.icon} />
                </svg>
                {tab.label}
              </NavLink>
            ))}
          </div>

          <div className="app-actions">
            <div className="create-menu" ref={createMenu}>
              <button type="button" className="create-test-button" aria-expanded={isCreateOpen} onClick={() => setIsCreateOpen((open) => !open)}>
                + Tạo đề <span aria-hidden="true" className="create-caret">▼</span>
              </button>
              {isCreateOpen && (
                <div className="create-dropdown" role="menu">
                  <Link role="menuitem" to="/tests/new?skill=reading">Đề Reading</Link>
                  <Link role="menuitem" to="/tests/new?skill=listening">Đề Listening</Link>
                </div>
              )}
            </div>
            <AccountMenu />
          </div>
        </nav>
        <div className="app-nav-strip" />
      </header>

      <Outlet />
    </>
  )
}
