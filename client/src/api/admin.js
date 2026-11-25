import http from './http.js'

// GET /admin/stats — totals, the last 30 days and the most taken system tests (admins only)
export async function getAdminStats() {
  const response = await http.get('/admin/stats')
  return response.data
}
