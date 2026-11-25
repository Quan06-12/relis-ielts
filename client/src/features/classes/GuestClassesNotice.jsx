import { useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../../auth/AuthContext.jsx'
import { getErrorMessage } from '../../api/errorMessages.js'
import { useToast } from '../../components/FeedbackProvider.jsx'

// Shown on the Classes page to a guest: classes need a real account.
// Signing in with Google here turns the guest into that account, keeping their tests and attempts.
export default function GuestClassesNotice() {
  const { signIn } = useAuth()
  const toast = useToast()
  const [error, setError] = useState('')

  async function handleCredential(credential) {
    setError('')
    try {
      await signIn(credential)
      toast('Đã đăng nhập bằng Google. Bài bạn làm lúc là khách vẫn được giữ.')
    } catch (signInError) {
      setError(getErrorMessage(signInError))
    }
  }

  return (
    <section className="guest-classes">
      <h2>Lớp học cần tài khoản Google</h2>
      <p>
        Bạn đang dùng thử với tư cách khách. Để tạo lớp hoặc tham gia lớp bằng mã giáo viên gửi, hãy đăng nhập bằng
        Google. Đề bạn đã tạo và các bài đã làm vẫn được giữ nguyên.
      </p>
      <div className="guest-classes-button">
        <GoogleLogin onSuccess={(response) => handleCredential(response.credential)} text="continue_with" locale="vi" />
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
    </section>
  )
}
