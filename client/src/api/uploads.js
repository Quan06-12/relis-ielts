import http from './http.js'

// POST /uploads — send a cover image or an audio file; returns { url, durationSec }
export async function uploadFile(file, kind) {
  const form = new FormData()
  form.append('kind', kind)
  form.append('file', file)
  const response = await http.post('/uploads', form)
  return response.data
}
