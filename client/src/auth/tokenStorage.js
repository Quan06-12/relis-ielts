// Keeps the app's JWT in localStorage so the user stays signed in after closing the tab.
// Wrapped in try/catch because private browsing can block localStorage.
const TOKEN_KEY = 'relis.token'

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function saveToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // Not saved: the user simply has to sign in again next time
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Nothing to clear
  }
}
