import http from './http.js'

// Endpoints used by the test editor and the library's edit/delete actions (owner A).

// POST /tests — create an empty draft; system: true (admins) puts it in "Kho đề Relis"
export async function createTest({ title, skill, kind, system = false }) {
  const response = await http.post('/tests', { title, skill, kind, ...(system ? { system: true } : {}) })
  return response.data.test
}

// GET /tests/:id — full test with answers
export async function getTest(testId) {
  const response = await http.get(`/tests/${testId}`)
  return response.data.test
}

// PUT /tests/:id — save the whole test; returns { test, warning }
export async function saveTest(test) {
  const { title, coverUrl, durationMin, sections } = test
  const response = await http.put(`/tests/${test.id}`, { title, coverUrl, durationMin, sections })
  return response.data
}

// PATCH /tests/:id/status — "published" or "draft"
export async function changeTestStatus(testId, status) {
  const response = await http.patch(`/tests/${testId}/status`, { status })
  return response.data.test
}

// DELETE /tests/:id
export async function deleteTest(testId) {
  await http.delete(`/tests/${testId}`)
}
