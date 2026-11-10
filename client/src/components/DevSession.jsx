import { useState } from 'react'
import http from '../api/http.js'
import { saveToken } from '../auth/tokenStorage.js'
import { getErrorMessage } from '../api/errorMessages.js'

// This component is only rendered with VITE_DEV_FIXTURES=true in Vite dev mode.
export default function DevSession() {
  const [error, setError] = useState(null),
    [busy, setBusy] = useState(false)
  async function enter() {
    setBusy(true)
    try {
      const { data } = await http.post('/dev/session')
      saveToken(data.token)
      window.location.assign('/library')
    } catch (err) {
      setError(err)
      setBusy(false)
    }
  }
  return (
    <div className="dev-session">
      <p>Dữ liệu dev: không dùng tài khoản thật. Audio là âm thử.</p>
      <button disabled={busy} onClick={enter}>
        {busy ? 'Đang mở…' : 'Vào bản demo local'}
      </button>
      {error && <p role="alert">{getErrorMessage(error)}</p>}
    </div>
  )
}
