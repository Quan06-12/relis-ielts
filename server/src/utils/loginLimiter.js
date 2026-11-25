// Slows down password guessing: after MAX_FAILURES wrong passwords for one username within WINDOW_MS,
// further tries for that username are refused until the window passes. Kept in memory, which is enough
// for the single Render instance; a restart simply forgets the counts.
const MAX_FAILURES = 5
const WINDOW_MS = 15 * 60 * 1000

export function createLoginLimiter({ maxFailures = MAX_FAILURES, windowMs = WINDOW_MS, now = Date.now } = {}) {
  const failures = new Map() // username -> { count, since }

  function current(key) {
    const entry = failures.get(key)
    if (entry && now() - entry.since > windowMs) {
      failures.delete(key)
      return null
    }
    return entry ?? null
  }

  return {
    // Seconds to wait before trying again, or 0 when trying is allowed
    retryAfterSec(key) {
      const entry = current(key)
      if (!entry || entry.count < maxFailures) return 0
      return Math.ceil((entry.since + windowMs - now()) / 1000)
    },
    recordFailure(key) {
      const entry = current(key) ?? { count: 0, since: now() }
      entry.count += 1
      failures.set(key, entry)
    },
    reset(key) {
      failures.delete(key)
    },
  }
}
