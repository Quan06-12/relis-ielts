import { Link, NavLink, Outlet } from 'react-router-dom'
import './AppLayout.css'

const tabs = [
  { label: 'Trang chủ', to: '/' },
  { label: 'Kho đề', to: '/library' },
  { label: 'Lớp học', to: '/classes' },
  { label: 'Từ vựng', to: '/vocab' },
  { label: 'Lịch sử', to: '/history' },
]

// Purple navigation bar shared by every page except the login, attempt and review pages.
export default function AppLayout() {
  return (
    <>
      <header className="app-header">
        <nav className="app-nav">
          <Link to="/" className="app-logo">
            <CubeIcon />
            <span>Relis</span>
          </Link>

          <div className="app-tabs">
            {tabs.map((tab) => (
              // `end` keeps "Trang chủ" from staying active on every page (all paths start with "/")
              <NavLink key={tab.to} to={tab.to} end={tab.to === '/'} className="app-tab">
                {tab.label}
              </NavLink>
            ))}
          </div>

          <div className="app-actions">
            <Link to="/tests/new" className="create-test-button">+ Tạo đề</Link>
            {/* The avatar and the sign-out menu are added in US01–US03 */}
            <div className="avatar" aria-hidden="true" />
          </div>
        </nav>
        <div className="app-nav-strip" />
      </header>

      <Outlet />
    </>
  )
}

// Line-drawn cube logo from the wireframe
function CubeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2.5l8.5 4.75v9.5L12 21.5l-8.5-4.75v-9.5z" />
      <path d="M3.5 7.25L12 12l8.5-4.75M12 12v9.5" />
    </svg>
  )
}
