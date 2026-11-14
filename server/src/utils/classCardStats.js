// Numbers on the class cards of the Classes page (wireframe "Lớp học"). Pure, unit tested.

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

// Teacher card: assignments still open, and attempts handed in during the last 7 days
export function teacherCardStats(assignments, submittedAttempts, now = new Date()) {
  return {
    openAssignmentCount: assignments.filter((assignment) => new Date(assignment.deadline) > now).length,
    recentSubmissionCount: submittedAttempts.filter((attempt) => now - new Date(attempt.submittedAt) <= WEEK_MS).length,
  }
}

// Student card: how many assignments they handed in, and the nearest one still to do
// assignments: [{ id, deadline, testTitle }], submittedIds: Set of assignment ids they submitted
export function studentCardStats(assignments, submittedIds, now = new Date()) {
  const todo = assignments
    .filter((assignment) => !submittedIds.has(String(assignment.id)) && new Date(assignment.deadline) > now)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))

  return {
    assignmentCount: assignments.length,
    submittedCount: assignments.filter((assignment) => submittedIds.has(String(assignment.id))).length,
    nextDue: todo.length > 0 ? { title: todo[0].testTitle, deadline: todo[0].deadline } : null,
  }
}
