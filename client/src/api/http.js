import axios from 'axios'
import { getToken } from '../auth/tokenStorage.js'

// The only place that knows the API address. Every request in the app goes through `http`.
const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

// Before each request: attach the saved token, if any.
http.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// The auth context registers what to do when the server says the token is no longer valid.
let handleUnauthorized = () => {}

export function onUnauthorized(handler) {
  handleUnauthorized = handler
}

// After each response: a 401 means the token is missing, wrong or expired, so the user must sign in again.
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      handleUnauthorized()
    }
    return Promise.reject(error)
  }
)

export default http
