import http from './http.js'

// POST /auth/google — exchange the Google credential for our own token and user.
export async function signInWithGoogle(credential) {
  const response = await http.post('/auth/google', { credential })
  return response.data // { token, user }
}

// POST /auth/register — create an account with name, email and password
export async function registerWithPassword({ name, email, password }) {
  const response = await http.post('/auth/register', { name, email, password })
  return response.data // { token, user }
}

// POST /auth/login — sign in with email and password
export async function signInWithPassword({ email, password }) {
  const response = await http.post('/auth/login', { email, password })
  return response.data // { token, user }
}

// GET /auth/me — who is signed in with the saved token.
export async function getCurrentUser() {
  const response = await http.get('/auth/me')
  return response.data.user
}
