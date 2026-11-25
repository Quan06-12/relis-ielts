import { useLayoutEffect, useRef, useState } from 'react'
import './SlideHighlight.css'

// A highlight that slides to the active item of its parent (a tab bar, a segmented switch, a menu),
// instead of the active style jumping from one item to the next.
// Put it as the first child of the bar; the bar gets `position: relative` from the class `slides`,
// and the item marked with the class "active" is where the highlight goes.
// variant: "pill" (white pill), "underline" (bar under the tab), "soft" (tinted row in a menu).
// activeKey: anything that changes when another item becomes active.
export default function SlideHighlight({ variant = 'pill', activeKey }) {
  const self = useRef(null)
  const [box, setBox] = useState(null)

  useLayoutEffect(() => {
    const bar = self.current?.parentElement
    if (!bar) return undefined
    bar.classList.add('slides')

    function measure() {
      const active = bar.querySelector(':scope > .active')
      setBox(active ? { left: active.offsetLeft, top: active.offsetTop, width: active.offsetWidth, height: active.offsetHeight } : null)
    }

    measure()
    // Sizes change when the window resizes, the web font loads or a count in a tab changes
    const observer = new ResizeObserver(measure)
    observer.observe(bar)
    return () => observer.disconnect()
  }, [activeKey])

  return (
    <span
      ref={self}
      aria-hidden="true"
      className={`slide-highlight ${variant}`}
      style={
        box
          ? { width: box.width, height: box.height, transform: `translate(${box.left}px, ${box.top}px)` }
          : { opacity: 0 }
      }
    />
  )
}
