// Target bands and exam date on the home page (US46). Pure, unit tested.

// A band is 0–9 in steps of 0.5, or null for "not set"
export function isValidBand(value) {
  if (value === null) return true
  return typeof value === 'number' && value >= 0 && value <= 9 && Number.isInteger(value * 2)
}

// Checks the body of PATCH /users/me; returns the list of problems (empty = valid)
export function checkProfileChanges(body) {
  const problems = []

  if (body.goals !== undefined) {
    if (typeof body.goals !== 'object' || body.goals === null) {
      problems.push({ field: 'goals', message: 'goals must be an object' })
    } else {
      for (const skill of ['reading', 'listening', 'overall']) {
        if (body.goals[skill] !== undefined && !isValidBand(body.goals[skill])) {
          problems.push({ field: `goals.${skill}`, message: 'a band is 0–9 in steps of 0.5, or null' })
        }
      }
    }
  }

  if (body.examDate !== undefined && body.examDate !== null && Number.isNaN(Date.parse(body.examDate))) {
    problems.push({ field: 'examDate', message: 'examDate must be a date or null' })
  }

  return problems
}
