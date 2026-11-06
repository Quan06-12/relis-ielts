import axios from 'axios'

// The only place that knows the API address. Every request in the app goes through `http`.
const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

export default http
