// The server owns the clock: the time left is always calculated from startedAt,
// never trusted from the browser (US30, US31).

export function secondsLeft(attempt, now = new Date()) {
  const endsAt = attempt.startedAt.getTime() + attempt.mode.timeLimitMin * 60 * 1000
  return Math.max(0, Math.ceil((endsAt - now.getTime()) / 1000))
}

// Answers close at the actual deadline, with no extra time for editing.
// A delayed POST /submit may still close the already saved answers, without accepting new ones.
export function isPastDeadline(attempt, now = new Date()) {
  const endsAt = attempt.startedAt.getTime() + attempt.mode.timeLimitMin * 60 * 1000
  return now.getTime() >= endsAt
}
