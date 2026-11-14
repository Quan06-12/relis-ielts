import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../auth/AuthContext.jsx'
import { getErrorMessage } from '../api/errorMessages.js'
import CubeLogo from '../components/CubeLogo.jsx'
import ExamIllustration from '../components/ExamIllustration.jsx'
import './LoginPage.css'

// US01: the only way in is "Continue with Google"; a new account is created on the first sign-in.
// The card has the states of the wireframe: ready, signing in, Google window closed, error with "Thử lại".
export default function LoginPage() {
  const { status, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [state, setState] = useState('ready') // 'ready' | 'signing-in' | 'cancelled' | 'error'
  const [error, setError] = useState('')
  const [lastCredential, setLastCredential] = useState(null) // kept so "Thử lại" can send it again

  // US02: go back to the page the user tried to open, or to the home page
  const nextPage = location.state?.from?.pathname ?? '/'

  if (status === 'signed-in') {
    return <Navigate to={nextPage} replace />
  }

  async function signInWith(credential) {
    setLastCredential(credential)
    setState('signing-in')
    try {
      await signIn(credential)
      navigate(nextPage, { replace: true })
    } catch (signInError) {
      // No response at all means the server could not be reached (or is still waking up on Render)
      setError(signInError.response ? getErrorMessage(signInError) : 'Không kết nối được tới máy chủ. Kiểm tra mạng rồi thử lại.')
      setState('error')
    }
  }

  return (
    <div className="login-page">
      <div className="login-frame">
        <section className="login-intro">
          <ExamIllustration />
          <h1>IELTS Practice Platform</h1>
          <p className="login-subtitle">
            Personal Test Library
            <br />
            Classroom
          </p>
          <p>
            Tự soạn và lưu đề Reading, Listening của riêng bạn. Tạo lớp, giao bài và theo dõi kết quả học viên ở cùng
            một nơi.
          </p>
        </section>

        <section className="login-panel">
          <div className="login-brand rl-spin">
            <CubeLogo size={52} />
            <span>Relis</span>
          </div>

          <div className="login-card">
            <h2>Chào mừng bạn</h2>
            <p>Đăng nhập hoặc tạo tài khoản bằng Google. Một tài khoản dùng được cho mọi lớp, dù bạn là người học hay người dạy học.</p>

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
                  width="320"
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
    </div>
  )
}
