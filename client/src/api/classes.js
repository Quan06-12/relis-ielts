import http from './http.js'

// Classes, class library and gradebook (US04–US07, US21, US40). Shapes: docs/api/openapi.yaml, tag "Classes".

// GET /classes?role=teacher|student
export async function listMyClasses(role) {
  const response = await http.get('/classes', { params: { role } })
  return response.data.items
}

// POST /classes — { name, description, color }
export async function createClass(fields) {
  const response = await http.post('/classes', fields)
  return response.data.class
}

// POST /classes/join — { code }
export async function joinClass(code) {
  const response = await http.post('/classes/join', { code })
  return response.data.class
}

export async function getClass(classId) {
  const response = await http.get(`/classes/${classId}`)
  return response.data.class
}

export async function listMembers(classId) {
  const response = await http.get(`/classes/${classId}/members`)
  return response.data.items
}

export async function listClassLibrary(classId) {
  const response = await http.get(`/classes/${classId}/library`)
  return response.data.items
}

// POST /classes/:id/library — tests already in the class are skipped by the server
export async function addToClassLibrary(classId, testIds) {
  const response = await http.post(`/classes/${classId}/library`, { testIds })
  return response.data.added
}

export async function removeFromClassLibrary(classId, testId) {
  await http.delete(`/classes/${classId}/library/${testId}`)
}

export async function getGradebook(classId) {
  const response = await http.get(`/classes/${classId}/gradebook`)
  return response.data // { tests, rows }
}
