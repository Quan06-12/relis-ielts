import { useEffect } from 'react'

// Pressing Esc closes the dialog on top, the same way a click on its dark backdrop does.
// Every dialog in the app is a [aria-modal] box inside a backdrop whose onClick closes it,
// so one listener here covers all of them without touching each dialog.
export default function EscapeToClose() {
  useEffect(() => {
    function closeTopDialog(event) {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      const dialogs = document.querySelectorAll('[aria-modal="true"]')
      const backdrop = dialogs[dialogs.length - 1]?.parentElement
      if (backdrop && /backdrop/.test(backdrop.className)) {
        event.preventDefault()
        backdrop.click()
      }
    }
    document.addEventListener('keydown', closeTopDialog)
    return () => document.removeEventListener('keydown', closeTopDialog)
  }, [])

  return null
}
