import http from './http.js'

// GET /tests — my test library, or the system tests with source: 'system' (filters: skill, kind, status, q, page)
export async function listMyTests(filters = {}) {
  const response = await http.get('/tests', { params: filters })
  return response.data // { items, total, page, limit }
}

// GET /tests/:id/play — the test without answers, for the choose-mode dialog
export async function getTestForPlay(testId) {
  const response = await http.get(`/tests/${testId}/play`)
  return response.data.test
}

// Tests a teacher can put into a class or assign: my published tests first, then the system tests
export async function listShareableTests() {
  const [mine, system] = await Promise.all([
    listMyTests({ status: 'published', limit: 50 }),
    listMyTests({ source: 'system', limit: 50 }),
  ])
  return [...mine.items, ...system.items]
}

// GET /tests/:id/classes — ids of the classes I teach that already hold this test
export async function listClassesWithTest(testId) {
  const response = await http.get(`/tests/${testId}/classes`)
  return response.data.classIds
}
