import http from './http.js'

// PATCH /users/me — { goals: { reading, listening, overall }, examDate }; only the fields sent change (US46)
export async function updateMyProfile(changes) {
  const response = await http.patch('/users/me', changes)
  return response.data.user
}
