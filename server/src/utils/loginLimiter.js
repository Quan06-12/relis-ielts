// Slows down password guessing: after MAX_FAILURES wrong passwords for one email within WINDOW_MS,
// further tries for that email are refused until the window passes. Kept in memory, which is enough
// for the single Render instance; a restart simply forgets the counts.
const MAX_FAILURES = 5
const WINDOW_MS = 15 * 60 * 1000

export function createLoginLimiter({ maxFailures = MAX_FAILURES, windowMs = WINDOW_MS, now = Date.now } = {}) {
  const failures = new Map() // email -> { count, since }

  function current(email) {
    const entry = failures.get(email)
    if (entry && now() - entry.since > windowMs) {
      failures.delete(email)
      return null
    }
    return entry ?? null
  }

  return {
    // Seconds to wait before trying again, or 0 when trying is allowed
    retryAfterSec(email) {
      const entry = current(email)
      if (!entry || entry.count < maxFailures) return 0
      return Math.ceil((entry.since + windowMs - now()) / 1000)
    },
    recordFailure(email) {
      const entry = current(email) ?? { count: 0, since: now() }
      entry.count += 1
      failures.set(email, entry)
    },
    reset(email) {
      failures.delete(email)
    },
  }
}
