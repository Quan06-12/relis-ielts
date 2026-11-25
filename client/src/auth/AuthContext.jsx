import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { googleLogout } from '@react-oauth/google'
import { signInWithGoogle, signInAsGuest, getCurrentUser } from '../api/auth.js'
import { onUnauthorized } from '../api/http.js'
import { getToken, saveToken, clearToken } from './tokenStorage.js'

const AuthContext = createContext(null)

// Holds the signed-in user for the whole app.
// status: 'checking' while we ask the server about a saved token, then 'signed-in' or 'signed-out'.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState(getToken() ? 'checking' : 'signed-out')

  const signOut = useCallback(() => {
    clearToken()
    googleLogout()
    setUser(null)
    setStatus('signed-out')
  }, [])

  // US02: any 401 from the API signs the user out; RequireAuth then sends them to /login
  useEffect(() => {
    onUnauthorized(signOut)
  }, [signOut])

  // When the app opens with a saved token, check it is still valid
  useEffect(() => {
    if (status !== 'checking') return

    getCurrentUser()
      .then((currentUser) => {
        setUser(currentUser)
        setStatus('signed-in')
      })
      .catch(() => {
        // Invalid token (401) or server unreachable: start from the login page
        clearToken()
        setStatus('signed-out')
      })
  }, [status])

  function keepSession({ token, user: signedInUser }) {
    saveToken(token)
    setUser(signedInUser)
    setStatus('signed-in')
  }

  // US01: called with the credential returned by the Google button.
  // A guest who is signed in sends their token too, so the server turns the guest into this Google account.
  async function signIn(credential) {
    keepSession(await signInWithGoogle(credential))
  }

  // "Dùng thử không cần tài khoản": a guest can do everything except create or join classes
  async function signInGuest() {
    keepSession(await signInAsGuest())
  }

  // After the user changes their profile (goals on the home page, US46)
  const updateUser = useCallback((changedUser) => setUser(changedUser), [])

  return (
    <AuthContext.Provider value={{ user, status, signIn, signInGuest, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
