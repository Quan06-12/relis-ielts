import http from './http.js'

// POST /attempts — start a test; returns { attempt, test }
// classId is set when the test is started from a class library, so it shows in the gradebook;
// assignmentId when it is homework (the server then takes the class from the assignment)
export async function startAttempt(testId, mode, classId = null, assignmentId = null) {
  const response = await http.post('/attempts', { testId, mode, classId, assignmentId })
  return response.data
}

// GET /attempts/:id — continue an attempt; returns { attempt, test }
export async function getAttempt(attemptId) {
  const response = await http.get(`/attempts/${attemptId}`)
  return response.data
}

// PATCH /attempts/:id/answers — save only the answers that changed
export async function saveAnswers(attemptId, answers) {
  const response = await http.patch(`/attempts/${attemptId}/answers`, { answers })
  return response.data // { savedAt, remainingSec }
}

// POST /attempts/:id/submit
export async function submitAttempt(attemptId) {
  const response = await http.post(`/attempts/${attemptId}/submit`)
  return response.data
}

// GET /attempts/:id/review — the submitted attempt with answers and explanations
// returns { attempt, test, viewerRole }
export async function getReview(attemptId) {
  const response = await http.get(`/attempts/${attemptId}/review`)
  return response.data
}

// GET /attempts — my history (filters: status, skill, source, range, q, page, limit)
export async function listMyAttempts(filters = {}) {
  const response = await http.get('/attempts', { params: filters })
  return response.data // { items, total, page, limit }
}
