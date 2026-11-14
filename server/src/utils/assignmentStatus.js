// Where a student stands on one assignment (US45). Pure, unit tested.
//
// attempt: the student's latest attempt for this assignment, or null
// Returns one of:
//   'todo'        not started, deadline not passed (or late hand-in allowed)
//   'in_progress' started, not handed in yet
//   'submitted'   handed in on time
//   'late'        handed in after the deadline (only possible when allowLate)
//   'missed'      deadline passed, nothing handed in, and late hand-in not allowed

export function assignmentStatus(assignment, attempt, now = new Date()) {
  const isPastDeadline = now > new Date(assignment.deadline)

  if (attempt?.status === 'submitted') {
    return attempt.isLate ? 'late' : 'submitted'
  }
  if (attempt?.status === 'in_progress') {
    return 'in_progress'
  }
  if (isPastDeadline && !assignment.allowLate) {
    return 'missed'
  }
  return 'todo'
}

// Can the student still start this assignment?
export function canStartAssignment(assignment, now = new Date()) {
  return assignment.allowLate || now <= new Date(assignment.deadline)
}
