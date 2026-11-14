import http from './http.js'

// Vocabulary sets and words (US47, US48). Shapes: docs/api/openapi.yaml, tag "Vocabulary".

export async function listMySets() {
  const response = await http.get('/vocab-sets')
  return response.data.items
}

// { name, color, coverUrl }
export async function createSet(fields) {
  const response = await http.post('/vocab-sets', fields)
  return response.data.set
}

export async function getSet(setId) {
  const response = await http.get(`/vocab-sets/${setId}`)
  return response.data.set
}

export async function updateSet(setId, fields) {
  const response = await http.patch(`/vocab-sets/${setId}`, fields)
  return response.data.set
}

export async function deleteSet(setId) {
  await http.delete(`/vocab-sets/${setId}`)
}

// { type, term, meaning, note, verbForms, collocations, example }
export async function addWord(setId, word) {
  const response = await http.post(`/vocab-sets/${setId}/words`, word)
  return response.data.word
}

export async function updateWord(setId, wordId, word) {
  const response = await http.put(`/vocab-sets/${setId}/words/${wordId}`, word)
  return response.data.word
}

export async function deleteWord(setId, wordId) {
  await http.delete(`/vocab-sets/${setId}/words/${wordId}`)
}
