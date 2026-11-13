import { useEffect, useRef, useState } from 'react'

// Counts down from `initialSeconds` (given by the server) and calls `onTimeUp` once at zero.
// It counts against a fixed end time, so a slow or background tab does not drift.
// Rounds up like the server, so zero means the deadline has really passed.
export function useCountdown(initialSeconds, onTimeUp) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds)
  const onTimeUpRef = useRef(onTimeUp)
  onTimeUpRef.current = onTimeUp

  useEffect(() => {
    if (initialSeconds === null) return undefined

    const endsAt = Date.now() + initialSeconds * 1000
    setSecondsLeft(initialSeconds)

    const timer = setInterval(() => {
      const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))
      setSecondsLeft(left)
      if (left === 0) {
        clearInterval(timer)
        onTimeUpRef.current()
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [initialSeconds])

  return secondsLeft
}
