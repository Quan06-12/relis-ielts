import { useRef, useState } from 'react'
import { clampRatio, ratioFromPointer } from './splitRatio.js'
import './SplitPane.css'

// Two panes with a bar between them that can be dragged (US38).
// direction "columns": side by side, the bar changes their widths;
// direction "rows": one above the other, the bar changes their heights.
// The bar also works with the arrow keys. On narrow screens the panes simply stack.
export default function SplitPane({ direction = 'columns', first, second, className = '', label }) {
  const container = useRef(null)
  const [ratio, setRatio] = useState(0.5)
  const isColumns = direction === 'columns'

  function handlePointerDown(event) {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
    const box = container.current.getBoundingClientRect()
    setRatio(isColumns ? ratioFromPointer(event.clientX, box.left, box.width) : ratioFromPointer(event.clientY, box.top, box.height))
  }

  function handleKeyDown(event) {
    const step = { ArrowLeft: -0.05, ArrowUp: -0.05, ArrowRight: 0.05, ArrowDown: 0.05 }[event.key]
    if (step) {
      event.preventDefault()
      setRatio((current) => clampRatio(current + step))
    }
  }

  // fr units: the two panes share the space, the bar keeps its own fixed size
  const tracks = `${ratio}fr 10px ${1 - ratio}fr`
  const style = isColumns ? { gridTemplateColumns: tracks } : { gridTemplateRows: tracks }

  return (
    <div ref={container} className={`split-pane ${direction} ${className}`} style={style}>
      <div className="split-pane-part">{first}</div>
      <div
        className="split-pane-bar"
        role="separator"
        aria-orientation={isColumns ? 'vertical' : 'horizontal'}
        aria-label={label}
        aria-valuenow={Math.round(ratio * 100)}
        aria-valuemin={25}
        aria-valuemax={75}
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onKeyDown={handleKeyDown}
        onDoubleClick={() => setRatio(0.5)}
        title="Kéo để đổi kích thước, bấm đúp để về giữa"
      />
      <div className="split-pane-part">{second}</div>
    </div>
  )
}
