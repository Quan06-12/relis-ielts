import http from './http.js'

// GET /tests — my test library (filters: skill, kind, status, q, page)
export async function listMyTests(filters = {}) {
  const response = await http.get('/tests', { params: filters })
  return response.data // { items, total, page, limit }
}

// GET /tests/:id/play — the test without answers, for the choose-mode dialog
export async function getTestForPlay(testId) {
  const response = await http.get(`/tests/${testId}/play`)
  return response.data.test
}
