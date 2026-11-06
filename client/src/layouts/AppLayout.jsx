import { Link, NavLink, Outlet } from 'react-router-dom'
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
export default function AppLayout() {
  return (
    <>
      <header className="app-header">
        <nav className="app-nav">
          <Link to="/" className="app-logo">
            <CubeLogo />
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
            <AccountMenu />
          </div>
        </nav>
        <div className="app-nav-strip" />
      </header>

      <Outlet />
    </>
  )
}
