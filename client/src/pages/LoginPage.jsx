import { useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../auth/AuthContext.jsx'
import { getErrorMessage } from '../api/errorMessages.js'
import CubeLogo from '../components/CubeLogo.jsx'
import TestWall from '../features/landing/TestWall.jsx'
import { startLogoFlight } from '../features/landing/logoFlight.js'
import './LoginPage.css'


// Landing page and sign-in in one (US01): everyone who is not signed in arrives here.
// Left: a still 3D wall of IELTS tests; right: what Relis is and "Continue with Google".
// After sign-in the Relis cube flies, tumbling, to the middle of the screen and then into the logo
// of the navy bar while the app opens (LogoFlightLayer.jsx).
export default function LoginPage() {
  const { status, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [state, setState] = useState('ready') // 'ready' | 'signing-in' | 'cancelled' | 'error'
  const [error, setError] = useState('')
  const [lastCredential, setLastCredential] = useState(null) // kept so "Thử lại" can send it again
  const brandCube = useRef(null)
  // True while we sign in from this page, so the plain redirect below does not skip the transition
  const isSigningInHere = useRef(false)

  // US02: go back to the page the user tried to open, or to the home page
  const nextPage = location.state?.from?.pathname ?? '/'

  if (status === 'signed-in' && !isSigningInHere.current) {
    return <Navigate to={nextPage} replace />
  }

  async function signInWith(credential) {
    setLastCredential(credential)
    setState('signing-in')
    isSigningInHere.current = true
    try {
      await signIn(credential)
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduceMotion) {
        goToApp() // the user asked for less motion
      } else {
        startLogoFlight(brandCube.current.getBoundingClientRect(), goToApp)
      }
    } catch (signInError) {
      isSigningInHere.current = false
      // No response at all means the server could not be reached (or is still waking up on Render)
      setError(signInError.response ? getErrorMessage(signInError) : 'Không kết nối được tới máy chủ. Kiểm tra mạng rồi thử lại.')
      setState('error')
    }
  }

  function goToApp() {
    navigate(nextPage, { replace: true })
  }

  return (
    <div className="landing">
      <div className="landing-wall">
        <TestWall />
      </div>

      <section className="landing-panel">
        <div className="login-brand rl-spin">
          <span ref={brandCube} className="login-brand-cube">
            <CubeLogo size={56} />
          </span>
          <span>Relis</span>
        </div>

        <h1>Luyện IELTS như thi thật</h1>
        <p className="landing-lead">Tạo kho đề của riêng bạn, lớp học và theo dõi kết quả cùng một nơi.</p>

        <div className="login-card">
          <p className="login-eyebrow">Bắt đầu miễn phí</p>
          <h2>Chào mừng bạn</h2>
          <p>Đăng nhập hoặc tạo tài khoản bằng Google.</p>

          {state === 'signing-in' ? (
            <div className="login-connecting" role="status">
              <span className="login-spinner" aria-hidden="true" /> Đang kết nối với Google…
            </div>
          ) : (
            <div className="login-google-button">
              <GoogleLogin
                onSuccess={(googleResponse) => signInWith(googleResponse.credential)}
                onError={() => setState('cancelled')}
                text="continue_with"
                shape="rectangular"
                width="400"
                locale="vi"
              />
            </div>
          )}

          {state === 'cancelled' && (
            <p className="login-note warning" role="status">
              <span aria-hidden="true">ⓘ</span> Bạn đã đóng cửa sổ Google trước khi đăng nhập xong. Bấm nút phía trên để thử lại.
            </p>
          )}
          {state === 'error' && (
            <div className="login-note error" role="alert">
              <span aria-hidden="true">⚠</span>
              <span>{error}</span>
              {lastCredential && (
                <button type="button" onClick={() => signInWith(lastCredential)}>Thử lại</button>
              )}
            </div>
          )}

          <p className="login-terms">Tiếp tục nghĩa là bạn đồng ý với Điều khoản và Chính sách quyền riêng tư của Relis.</p>
        </div>
      </section>
    </div>
  )
}
