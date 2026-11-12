import http from './http.js'

// POST /attempts — start a test; returns { attempt, test }
export async function startAttempt(testId, mode) {
  const response = await http.post('/attempts', { testId, mode })
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
