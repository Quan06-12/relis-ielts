import { useEffect, useRef, useState } from 'react'
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
  const { status, signIn, signInGuest } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [state, setState] = useState('ready') // 'ready' | 'signing-in' | 'cancelled' | 'error'
  const [error, setError] = useState('')
  const [lastCredential, setLastCredential] = useState(null) // kept so "Thử lại" can send it again
  const brandCube = useRef(null)
  // The Google button has a fixed width in pixels; measure its box so it fits phones too
  const buttonBox = useRef(null)
  const [buttonWidth, setButtonWidth] = useState(null)

  useEffect(() => {
    const box = buttonBox.current
    if (!box) return undefined
    const measure = () => setButtonWidth(Math.min(400, Math.floor(box.clientWidth)))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(box)
    return () => observer.disconnect()
  }, [state])
  // True while we sign in from this page, so the plain redirect below does not skip the transition
  const isSigningInHere = useRef(false)

  // US02: go back to the page the user tried to open, or to the home page
  const nextPage = location.state?.from?.pathname ?? '/'

  if (status === 'signed-in' && !isSigningInHere.current) {
    return <Navigate to={nextPage} replace />
  }

  function signInWith(credential) {
    setLastCredential(credential)
    return finishSignIn(() => signIn(credential))
  }

  function signInAsGuest() {
    setLastCredential(null)
    return finishSignIn(signInGuest)
  }

  async function finishSignIn(action) {
    setState('signing-in')
    isSigningInHere.current = true
    try {
      await action()
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

        {/* On phones "thật" always starts the second line; on wider screens the break is hidden */}
        <h1>
          Luyện IELTS như thi <br className="title-break" />
          thật
        </h1>
        <p className="landing-lead">Tạo kho đề của riêng bạn, lớp học và theo dõi kết quả cùng một nơi.</p>

        <div className="login-card">
          <p className="login-eyebrow">Bắt đầu miễn phí</p>
          <h2>Chào mừng bạn</h2>
          <p>Đăng nhập bằng Google, hoặc dùng thử với tư cách khách.</p>

          {state === 'signing-in' ? (
            <div className="login-connecting" role="status">
              <span className="login-spinner" aria-hidden="true" /> {lastCredential ? 'Đang kết nối với Google…' : 'Đang mở chế độ khách…'}
            </div>
          ) : (
            <div className="login-google-button" ref={buttonBox}>
              {buttonWidth && (
                <GoogleLogin
                  onSuccess={(googleResponse) => signInWith(googleResponse.credential)}
                  onError={() => setState('cancelled')}
                  text="continue_with"
                  shape="rectangular"
                  width={String(buttonWidth)}
                  locale="vi"
                />
              )}
            </div>
          )}

          {state !== 'signing-in' && (
            <div className="login-guest">
              <p className="login-divider"><span>hoặc</span></p>
              <button type="button" className="login-guest-button" onClick={signInAsGuest}>Dùng thử không cần tài khoản</button>
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
