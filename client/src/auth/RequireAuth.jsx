import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext.jsx'

// US02: wraps every page that needs a signed-in user.
export default function RequireAuth() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'checking') {
    return <p className="page">Đang tải…</p>
  }

  if (status === 'signed-out') {
    // Remember where the user wanted to go, so the login page can bring them back
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
