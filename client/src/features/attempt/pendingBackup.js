// US33: keep answers that are not saved on the server yet in the browser, so a reload
// in the second before autosave does not lose them. Cleared once the server has them.
//
// `storage` is window.localStorage in the app; tests pass a small fake.
// localStorage can throw (private mode, storage full), so every call is wrapped: the backup is a bonus.

const keyFor = (attemptId) => `relis:pending-answers:${attemptId}`

export function backupPending(attemptId, pending, storage = window.localStorage) {
  try {
    if (Object.keys(pending).length === 0) storage.removeItem(keyFor(attemptId))
    else storage.setItem(keyFor(attemptId), JSON.stringify(pending))
  } catch {
    // no backup this time; autosave still runs
  }
}

// { questionId: ["value"] } left from before the reload, or {}
export function loadPending(attemptId, storage = window.localStorage) {
  try {
    const saved = JSON.parse(storage.getItem(keyFor(attemptId)) ?? '{}')
    return saved && typeof saved === 'object' ? saved : {}
  } catch {
    return {}
  }
}

export function clearPending(attemptId, storage = window.localStorage) {
  backupPending(attemptId, {}, storage)
}
