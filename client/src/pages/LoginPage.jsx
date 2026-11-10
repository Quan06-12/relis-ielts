import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../auth/AuthContext.jsx'
import { getErrorMessage } from '../api/errorMessages.js'
import CubeLogo from '../components/CubeLogo.jsx'
import './LoginPage.css'
import DevSession from '../components/DevSession.jsx'

// US01: the only way in is "Continue with Google"; a new account is created on the first sign-in.
export default function LoginPage() {
  const { status, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState('')
  const [isSigningIn, setIsSigningIn] = useState(false)

  // US02: go back to the page the user tried to open, or to the home page
  const nextPage = location.state?.from?.pathname ?? '/'

  if (status === 'signed-in') {
    return <Navigate to={nextPage} replace />
  }

  async function handleGoogleSuccess(googleResponse) {
    setError('')
    setIsSigningIn(true)
    try {
      await signIn(googleResponse.credential)
      navigate(nextPage, { replace: true })
    } catch (signInError) {
      setError(getErrorMessage(signInError))
    } finally {
      setIsSigningIn(false)
    }
  }

  return (
    <div className="login-page">
      <section className="login-intro">
        <h1>IELTS Practice Platform</h1>
        <p className="login-subtitle">Personal Test Library · Classroom</p>
        <p>
          Luyện Reading và Listening như thi thật: đồng hồ đếm ngược, chấm điểm và quy đổi band, xem
          lại từng câu có giải thích. Giáo viên tạo lớp, giao đề và theo dõi điểm của cả lớp.
        </p>
      </section>

      <section className="login-panel">
        <div className="login-brand">
          <CubeLogo size={56} />
          <span>Relis</span>
        </div>

        <div className="login-card">
          <h2>Chào mừng đến với Relis</h2>
          <p>Đăng nhập bằng tài khoản Google để bắt đầu. Lần đầu đăng nhập sẽ tự tạo tài khoản.</p>

          <div className="login-google-button">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Không đăng nhập được với Google, vui lòng thử lại.')}
              text="continue_with"
              shape="pill"
              locale="vi"
            />
          </div>
          {import.meta.env.DEV && import.meta.env.VITE_DEV_FIXTURES === 'true' && <DevSession />}

          {isSigningIn && <p className="login-status">Đang đăng nhập…</p>}
          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
