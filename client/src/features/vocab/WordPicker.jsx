import { useEffect, useRef, useState } from 'react'
import AddWordDialog from './AddWordDialog.jsx'
import { sentenceAround, termFrom, MAX_TERM_LENGTH } from './fromPassage.js'
import '../attempt/HighlightablePassage.css'

// On the review page: select a word or phrase in the passage (or transcript) and a small
// "Thêm vào từ vựng" button appears; it opens the add-word dialog with the term and its sentence filled in.
// `text` must be exactly the text shown inside, so a selection can be turned into positions in it.
export default function WordPicker({ text, newSetName, children }) {
  const box = useRef(null)
  const menuRef = useRef(null)
  const [menu, setMenu] = useState(null) // { x, y, below, start, end }
  const [word, setWord] = useState(null) // { term, example } while the dialog is open

  useEffect(() => {
    if (!menu) return undefined
    const close = () => setMenu(null)
    const closeOnOutside = (event) => !menuRef.current?.contains(event.target) && !box.current?.contains(event.target) && close()
    const closeOnEscape = (event) => event.key === 'Escape' && close()
    document.addEventListener('pointerdown', closeOnOutside)
    document.addEventListener('keydown', closeOnEscape)
    window.addEventListener('scroll', close, true)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside)
      document.removeEventListener('keydown', closeOnEscape)
      window.removeEventListener('scroll', close, true)
    }
  }, [menu])

  function handleSelectionEnd() {
    // Let the browser finish updating the selection first
    setTimeout(() => {
      const selection = window.getSelection()
      const root = box.current
      if (!root || !selection || selection.rangeCount === 0 || selection.isCollapsed) return setMenu(null)
      const range = selection.getRangeAt(0)
      if (!root.contains(range.commonAncestorContainer)) return setMenu(null)

      // Position of the selection in the text: the length of everything before it
      const before = document.createRange()
      before.selectNodeContents(root)
      before.setEnd(range.startContainer, range.startOffset)
      const start = before.toString().length
      const end = start + range.toString().length
      if (end - start > MAX_TERM_LENGTH || termFrom(text.slice(start, end)) === '') return setMenu(null)

      const rect = range.getBoundingClientRect()
      const below = rect.top < 140
      const x = Math.min(Math.max(rect.left + rect.width / 2, 110), window.innerWidth - 110)
      setMenu({ x, y: below ? rect.bottom : rect.top, below, start, end })
    }, 0)
  }

  function openDialog() {
    setWord({ term: termFrom(text.slice(menu.start, menu.end)), example: sentenceAround(text, menu.start, menu.end) })
    window.getSelection()?.removeAllRanges()
    setMenu(null)
  }

  return (
    <>
      <div ref={box} onPointerUp={handleSelectionEnd} onKeyUp={handleSelectionEnd}>
        {children}
      </div>

      {menu && (
        <div
          ref={menuRef}
          className={menu.below ? 'exam-menu below' : 'exam-menu'}
          style={{ left: menu.x, top: menu.y }}
          role="toolbar"
          aria-label="Thêm vào từ vựng"
          onMouseDown={(event) => event.preventDefault()}
        >
          <button type="button" onClick={openDialog}>
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2zM4 21V5M11 7v6M8 10h6" />
            </svg>
            Thêm vào từ vựng
          </button>
        </div>
      )}

      {word && <AddWordDialog term={word.term} example={word.example} newSetName={newSetName} onClose={() => setWord(null)} />}
    </>
  )
}
