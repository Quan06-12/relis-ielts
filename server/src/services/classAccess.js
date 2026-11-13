import { ClassMember } from '../models/ClassMember.js'
import { ClassLibraryItem } from '../models/ClassLibraryItem.js'

// Questions about "who may do what in a class", shared by the class, test and attempt controllers.

// The user's role in the class ("teacher" / "student"), or null when they are not a member
export async function findRole(classId, userId) {
  const membership = await ClassMember.findOne({ classId, userId })
  return membership ? membership.role : null
}

export async function isTeacherOf(classId, userId) {
  return (await findRole(classId, userId)) === 'teacher'
}

// True when the test is in the library of the class and the user is a member of that class
export async function canTakeFromClass(classId, testId, userId) {
  const [role, item] = await Promise.all([findRole(classId, userId), ClassLibraryItem.exists({ classId, testId })])
  return role !== null && item !== null
}

// True when the test is in the library of any class the user belongs to
export async function isInOneOfMyClasses(testId, userId) {
  const myClassIds = await ClassMember.distinct('classId', { userId })
  if (myClassIds.length === 0) return false
  return (await ClassLibraryItem.exists({ testId, classId: { $in: myClassIds } })) !== null
}
