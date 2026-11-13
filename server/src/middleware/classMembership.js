import mongoose from 'mongoose'
import { notFound } from '../errors/AppError.js'
import { findRole } from '../services/classAccess.js'

// For every /api/classes/:classId/... route: the user must be a member of the class.
// Stores their role in request.classRole. Someone outside the class gets 404, not 403,
// so strangers cannot find out which classes exist.
export async function loadMembership(request, response, next) {
  const { classId } = request.params
  const role = mongoose.isValidObjectId(classId) ? await findRole(classId, request.userId) : null

  if (!role) {
    throw notFound('Class')
  }

  request.classRole = role
  next()
}

// Put after loadMembership on routes only teachers may use (library changes, gradebook, members).
// Students get the same 404 as strangers.
export function requireTeacher(request, response, next) {
  if (request.classRole !== 'teacher') {
    throw notFound('Class')
  }
  next()
}
