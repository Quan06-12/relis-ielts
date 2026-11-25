import http from './http.js'

// POST /auth/google — exchange the Google credential for our own token and user.
export async function signInWithGoogle(credential) {
  const response = await http.post('/auth/google', { credential })
  return response.data // { token, user }
}

// POST /auth/register — create an account with a username and password (name is optional)
export async function registerWithPassword({ username, password, name }) {
  const response = await http.post('/auth/register', { username, password, name })
  return response.data // { token, user }
}

// POST /auth/login — sign in with username and password
export async function signInWithPassword({ username, password }) {
  const response = await http.post('/auth/login', { username, password })
  return response.data // { token, user }
}

// GET /auth/me — who is signed in with the saved token.
export async function getCurrentUser() {
  const response = await http.get('/auth/me')
  return response.data.user
}
