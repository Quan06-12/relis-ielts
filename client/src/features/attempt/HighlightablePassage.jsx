import { useEffect, useRef, useState } from 'react'
import { addRange, removeRange, overlapsAny, rangeAt, paintLayers, paragraphsOf } from './highlights.js'
import './HighlightablePassage.css'

// Icons drawn as SVG paths (24×24, stroke), like the toolbar of the computer-based IELTS
const ICONS = {
  note: 'M4 5h16v11H9l-5 4zM8 9h8M8 12h5',
  highlight: 'M14 4l6 6-9 9H5v-6zM12 6l6 6M4 21h16',
  clear: 'M7 21h10M5 13l7-7 6 6-7 7H8zM9 10l5 5',
}

function Icon({ name }) {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={ICONS[name]} />
    </svg>
  )
}

// US43: the passage of a Reading test, where the student selects words to work with them like on the
// computer-based IELTS: a small menu offers "Note" (attach a note to the words) and "Highlight"
// (and "Clear" when the selection touches a highlight). Clicking a highlight offers "Clear";
// clicking noted words shows the note, which can be edited or deleted.
// Every piece of text carries data-start (its position in the passage), so a selection maps back to positions.
export default function HighlightablePassage({ title, passage, ranges, notes, onChange, onNotesChange }) {
  const article = useRef(null)
  const popupRef = useRef(null)
  const [menu, setMenu] = useState(null) // { x, y, below, range, canAdd, canRemove }
  const [noteBox, setNoteBox] = useState(null) // { x, y, below, index (-1 = new), range, text, isEditing }

  const isOpen = menu || noteBox

  // Close on Esc, on a click elsewhere, or when the passage scrolls
  useEffect(() => {
    if (!isOpen) return undefined
    const closeAll = () => {
      setMenu(null)
      setNoteBox(null)
    }
    const closeOnEscape = (event) => event.key === 'Escape' && closeAll()
    const closeOnOutside = (event) => !popupRef.current?.contains(event.target) && !article.current?.contains(event.target) && closeAll()
    const scroller = article.current
    document.addEventListener('keydown', closeOnEscape)
    document.addEventListener('pointerdown', closeOnOutside)
    scroller?.addEventListener('scroll', closeAll)
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      document.removeEventListener('pointerdown', closeOnOutside)
      scroller?.removeEventListener('scroll', closeAll)
    }
  }, [isOpen])

  // After the mouse (or finger, or Shift+arrows) finishes a selection, show the menu above it
  function handleSelectionEnd(event) {
    if (popupRef.current?.contains(event.target)) return
    // Let the browser finish updating the selection first
    setTimeout(() => {
      const selected = readSelection(article.current)
      if (selected) {
        const { range, rect } = selected
        setNoteBox(null)
        setMenu(placeAt(rect, { range, canAdd: true, canRemove: overlapsAny(ranges, range) }))
        return
      }
      setMenu(null)
      setNoteBox(null)
      const mark = event.target.closest?.('mark[data-start]')
      if (!mark) return
      // Noted words: show the note
      if (mark.dataset.note !== undefined) {
        const index = Number(mark.dataset.note)
        const note = notes[index]
        if (note) setNoteBox(placeAt(mark.getBoundingClientRect(), { index, range: note, text: note.text, isEditing: false }))
        return
      }
      // A highlight: offer to clear it
      const clicked = rangeAt(ranges, Number(mark.dataset.start))
      if (clicked) setMenu(placeAt(mark.getBoundingClientRect(), { range: clicked, canAdd: false, canRemove: true }))
    }, 0)
  }

  function finish() {
    window.getSelection()?.removeAllRanges()
    setMenu(null)
  }

  function highlight() {
    onChange(addRange(ranges, menu.range))
    finish()
  }

  function clear() {
    onChange(removeRange(ranges, menu.range))
    finish()
  }

  function startNote() {
    setNoteBox({ ...menu, index: -1, text: '', isEditing: true })
    finish()
  }

  function saveNote() {
    const text = noteBox.text.trim()
    if (text === '') return
    const note = { start: noteBox.range.start, end: noteBox.range.end, text }
    onNotesChange(noteBox.index === -1 ? [...notes, note] : notes.map((item, index) => (index === noteBox.index ? note : item)))
    setNoteBox(null)
  }

  function deleteNote() {
    onNotesChange(notes.filter((_, index) => index !== noteBox.index))
    setNoteBox(null)
  }

  return (
    <article ref={article} className="attempt-passage" onPointerUp={handleSelectionEnd} onKeyUp={handleSelectionEnd}>
      <h2>{title}</h2>
      <p className="highlight-hint">Bôi đen chữ trong bài để ghi chú hoặc highlight</p>
      {paragraphsOf(passage).map((paragraph) => (
        <p key={paragraph.offset}>
          {paintLayers(paragraph.text, paragraph.offset, ranges, notes).map((piece) => {
            if (piece.note >= 0) {
              return (
                <mark
                  key={piece.start}
                  className={piece.marked ? 'student-note student-highlight' : 'student-note'}
                  data-start={piece.start}
                  data-note={piece.note}
                  title={notes[piece.note].text}
                >
                  {piece.text}
                </mark>
              )
            }
            return piece.marked ? (
              <mark key={piece.start} className="student-highlight" data-start={piece.start}>{piece.text}</mark>
            ) : (
              <span key={piece.start} data-start={piece.start}>{piece.text}</span>
            )
          })}
        </p>
      ))}

      {menu && (
        <div
          ref={popupRef}
          className={menu.below ? 'exam-menu below' : 'exam-menu'}
          style={{ left: menu.x, top: menu.y }}
          role="toolbar"
          aria-label="Ghi chú và highlight"
          // Keep the text selected while a button is pressed
          onMouseDown={(event) => event.preventDefault()}
        >
          {menu.canAdd && (
            <>
              <button type="button" onClick={startNote}><Icon name="note" /> Note</button>
              <button type="button" onClick={highlight}><Icon name="highlight" /> Highlight</button>
            </>
          )}
          {menu.canRemove && (
            <button type="button" onClick={clear}><Icon name="clear" /> Clear</button>
          )}
        </div>
      )}

      {noteBox && (
        <div ref={popupRef} className={noteBox.below ? 'note-box below' : 'note-box'} style={{ left: noteBox.x, top: noteBox.y }} role="dialog" aria-label="Ghi chú">
          <p className="note-box-quote">“{passage.slice(noteBox.range.start, noteBox.range.end)}”</p>
          {noteBox.isEditing ? (
            <>
              <textarea
                autoFocus
                rows={3}
                maxLength={500}
                placeholder="Ghi chú của bạn…"
                value={noteBox.text}
                onChange={(event) => setNoteBox((current) => ({ ...current, text: event.target.value }))}
              />
              <div className="note-box-actions">
                <button type="button" onClick={() => setNoteBox(null)}>Huỷ</button>
                <button type="button" className="primary" onClick={saveNote} disabled={noteBox.text.trim() === ''}>Lưu</button>
              </div>
            </>
          ) : (
            <>
              <p className="note-box-text">{noteBox.text}</p>
              <div className="note-box-actions">
                <button type="button" onClick={deleteNote}>Xoá</button>
                <button type="button" className="primary" onClick={() => setNoteBox((current) => ({ ...current, isEditing: true }))}>Sửa</button>
              </div>
            </>
          )}
        </div>
      )}
    </article>
  )
}

// Popup position: centred above the selection, or below it when there is no room at the top.
// Kept away from the window edges so the whole popup stays visible.
const POPUP_HALF_WIDTH = 150

function placeAt(rect, fields) {
  const below = rect.top < 140
  const centre = rect.left + rect.width / 2
  const x = Math.min(Math.max(centre, POPUP_HALF_WIDTH), window.innerWidth - POPUP_HALF_WIDTH)
  return { ...fields, x, y: below ? rect.bottom : rect.top, below }
}

// The current selection as passage positions, or null when nothing in the passage is selected
function readSelection(root) {
  const selection = window.getSelection()
  if (!root || !selection || selection.rangeCount === 0 || selection.isCollapsed) return null
  const domRange = selection.getRangeAt(0)
  if (!root.contains(domRange.commonAncestorContainer)) return null
  const start = positionOf(root, domRange.startContainer, domRange.startOffset)
  const end = positionOf(root, domRange.endContainer, domRange.endOffset)
  if (start === null || end === null || end <= start) return null
  return { range: { start, end }, rect: domRange.getBoundingClientRect() }
}

// Turns a DOM point (node + offset) into a position in the passage text
function positionOf(root, node, offset) {
  const piece = node.nodeType === Node.TEXT_NODE ? node.parentElement : node
  if (piece?.dataset?.start !== undefined) {
    const start = Number(piece.dataset.start)
    // Inside the text of a piece the offset counts characters; on the piece itself 0 = before, 1 = after
    return node.nodeType === Node.TEXT_NODE ? start + offset : start + (offset > 0 ? piece.textContent.length : 0)
  }
  // A point between elements (or in the title): use the nearest piece after it, else the end of the one before
  let container = node.nodeType === Node.TEXT_NODE ? node.parentElement : node
  let index = node.nodeType === Node.TEXT_NODE ? indexIn(node) + 1 : offset
  while (container && root.contains(container)) {
    const children = [...container.childNodes]
    for (const child of children.slice(index)) {
      const first = child.nodeType === Node.ELEMENT_NODE && (child.matches('[data-start]') ? child : child.querySelector('[data-start]'))
      if (first) return Number(first.dataset.start)
    }
    for (const child of children.slice(0, index).reverse()) {
      const all = child.nodeType === Node.ELEMENT_NODE && (child.matches('[data-start]') ? [child] : [...child.querySelectorAll('[data-start]')])
      const last = all && all.at(-1)
      if (last) return Number(last.dataset.start) + last.textContent.length
    }
    if (container === root) break
    index = indexIn(container) + 1
    container = container.parentElement
  }
  return null
}

function indexIn(node) {
  return [...node.parentNode.childNodes].indexOf(node)
}
