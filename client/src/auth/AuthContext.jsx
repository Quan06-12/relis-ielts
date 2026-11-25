import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { googleLogout } from '@react-oauth/google'
import { signInWithGoogle, signInWithPassword, registerWithPassword, getCurrentUser } from '../api/auth.js'
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

  // US01: called by the login page with the credential returned by the Google button
  async function signIn(credential) {
    keepSession(await signInWithGoogle(credential))
  }

  // Username and password: sign in to an existing account, or create one
  async function signInWithUsername(fields) {
    keepSession(await signInWithPassword(fields))
  }

  async function register(fields) {
    keepSession(await registerWithPassword(fields))
  }

  // After the user changes their profile (goals on the home page, US46)
  const updateUser = useCallback((changedUser) => setUser(changedUser), [])

  return (
    <AuthContext.Provider value={{ user, status, signIn, signInWithUsername, register, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
