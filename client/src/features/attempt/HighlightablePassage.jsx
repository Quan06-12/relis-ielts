import { useEffect, useRef, useState } from 'react'
import { addRange, removeRange, overlapsAny, rangeAt, paintParagraph, paragraphsOf } from './highlights.js'
import './HighlightablePassage.css'

// US43: the passage of a Reading test, where the student can select words to highlight them,
// like the highlighter of the computer-based IELTS. Selecting text shows a small menu
// ("Tô sáng", and "Bỏ tô sáng" when the selection touches a highlight); clicking a highlight offers removal.
// Every piece of text carries data-start (its position in the passage), so a selection maps back to positions.
export default function HighlightablePassage({ title, passage, ranges, onChange }) {
  const article = useRef(null)
  const menuRef = useRef(null)
  const [menu, setMenu] = useState(null) // { x, y, below, range, canAdd, canRemove }

  // Close the menu on Esc, on a click elsewhere, or when the passage scrolls
  useEffect(() => {
    if (!menu) return undefined
    const closeOnEscape = (event) => event.key === 'Escape' && setMenu(null)
    const closeOnOutside = (event) => !menuRef.current?.contains(event.target) && !article.current?.contains(event.target) && setMenu(null)
    const scroller = article.current
    const close = () => setMenu(null)
    document.addEventListener('keydown', closeOnEscape)
    document.addEventListener('pointerdown', closeOnOutside)
    scroller?.addEventListener('scroll', close)
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      document.removeEventListener('pointerdown', closeOnOutside)
      scroller?.removeEventListener('scroll', close)
    }
  }, [menu])

  // After the mouse (or finger, or Shift+arrows) finishes a selection, show the menu above it
  function handleSelectionEnd(event) {
    // Let the browser finish updating the selection first
    setTimeout(() => {
      const selected = readSelection(article.current)
      if (selected) {
        const { range, rect } = selected
        setMenu(menuAt(rect, { range, canAdd: true, canRemove: overlapsAny(ranges, range) }))
        return
      }
      // A click on a highlight (no selection): offer to remove that highlight
      const mark = event.target.closest?.('mark[data-start]')
      const clicked = mark && rangeAt(ranges, Number(mark.dataset.start))
      setMenu(clicked ? menuAt(mark.getBoundingClientRect(), { range: clicked, canAdd: false, canRemove: true }) : null)
    }, 0)
  }

  function apply(change) {
    onChange(change(ranges, menu.range))
    window.getSelection()?.removeAllRanges()
    setMenu(null)
  }

  return (
    <article ref={article} className="attempt-passage" onPointerUp={handleSelectionEnd} onKeyUp={handleSelectionEnd}>
      <h2>{title}</h2>
      <p className="highlight-hint">Bôi đen chữ trong bài để tô sáng</p>
      {paragraphsOf(passage).map((paragraph) => (
        <p key={paragraph.offset}>
          {paintParagraph(paragraph.text, paragraph.offset, ranges).map((piece) =>
            piece.marked ? (
              <mark key={piece.start} className="student-highlight" data-start={piece.start}>{piece.text}</mark>
            ) : (
              <span key={piece.start} data-start={piece.start}>{piece.text}</span>
            )
          )}
        </p>
      ))}

      {menu && (
        <div
          ref={menuRef}
          className={menu.below ? 'highlight-menu below' : 'highlight-menu'}
          style={{ left: menu.x, top: menu.y }}
          role="toolbar"
          aria-label="Tô sáng"
          // Keep the text selected while a button is pressed
          onMouseDown={(event) => event.preventDefault()}
          onPointerUp={(event) => event.stopPropagation()}
        >
          {menu.canAdd && (
            <button type="button" onClick={() => apply(addRange)}>
              <span className="swatch" aria-hidden="true" /> Tô sáng
            </button>
          )}
          {menu.canRemove && (
            <button type="button" onClick={() => apply(removeRange)}>Bỏ tô sáng</button>
          )}
        </div>
      )}
    </article>
  )
}

// Menu position: centred above the selection, or below it when there is no room at the top
function menuAt(rect, fields) {
  const below = rect.top < 64
  return { ...fields, x: rect.left + rect.width / 2, y: below ? rect.bottom : rect.top, below }
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
