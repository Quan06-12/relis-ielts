import http from './http.js'

// POST /auth/google — exchange the Google credential for our own token and user.
export async function signInWithGoogle(credential) {
  const response = await http.post('/auth/google', { credential })
  return response.data // { token, user }
}

// POST /auth/guest — try Relis without an account
export async function signInAsGuest() {
  const response = await http.post('/auth/guest')
  return response.data // { token, user }
}

// GET /auth/me — who is signed in with the saved token.
export async function getCurrentUser() {
  const response = await http.get('/auth/me')
  return response.data.user
}
