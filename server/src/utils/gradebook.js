// Builds the class gradebook (US40) from plain data, so it can be unit tested without a database.
//
// students: [{ id, name, email, avatarUrl }]
// tests:    [{ id, title, skill }]                 tests in the class library
// attempts: [{ id, userId, testId, result, submittedAt }]   submitted attempts made from this class
//
// Each cell is the student's latest submitted attempt on that test, or null when they have not done it.

export function buildGradebook(students, tests, attempts) {
  const latest = new Map() // "userId:testId" → attempt
  for (const attempt of attempts) {
    const key = `${attempt.userId}:${attempt.testId}`
    const current = latest.get(key)
    if (!current || new Date(attempt.submittedAt) > new Date(current.submittedAt)) {
      latest.set(key, attempt)
    }
  }

  const rows = students.map((student) => {
    const cells = tests.map((test) => {
      const attempt = latest.get(`${student.id}:${test.id}`)
      if (!attempt) return null
      return {
        testId: test.id,
        attemptId: attempt.id,
        correct: attempt.result?.correct ?? null,
        total: attempt.result?.total ?? null,
        band: attempt.result?.band ?? null,
        submittedAt: attempt.submittedAt,
      }
    })
    return { student, cells, averageBand: averageBand(cells) }
  })

  return { tests, rows }
}

// Average of the bands a student has (full tests only), rounded the IELTS way:
// .25 goes up to .5 and .75 goes up to the next whole band. null when there is no band yet.
export function averageBand(cells) {
  const bands = cells.filter((cell) => cell && cell.band !== null).map((cell) => cell.band)
  if (bands.length === 0) return null
  const average = bands.reduce((sum, band) => sum + band, 0) / bands.length
  return Math.round(average * 2) / 2
}
