// Allows at most `max` calls per key (for example an IP address) within `windowMs`.
// Kept in memory, which is enough for the single Render instance.
export function createRateLimit({ max, windowMs, now = Date.now }) {
  const calls = new Map() // key -> { count, since }

  return {
    allow(key) {
      const entry = calls.get(key)
      if (!entry || now() - entry.since > windowMs) {
        calls.set(key, { count: 1, since: now() })
        return true
      }
      entry.count += 1
      return entry.count <= max
    },
  }
}
