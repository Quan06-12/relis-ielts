import { useLayoutEffect, useRef, useState } from 'react'
import './TabSlider.css'

// Finds the tab with the "active" class inside a tab bar and returns where it sits,
// so one shared highlight can slide to it instead of jumping from tab to tab.
// `activeKey` is whatever changes when another tab becomes active (a path, a filter value).
export function useTabSlider(activeKey) {
  const barRef = useRef(null)
  const [box, setBox] = useState(null)

  useLayoutEffect(() => {
    const bar = barRef.current
    if (!bar) return undefined

    function measure() {
      const activeTab = bar.querySelector(':scope > .active')
      setBox(activeTab ? { left: activeTab.offsetLeft, width: activeTab.offsetWidth } : null)
    }

    measure()
    // Tab widths change when the window resizes or the web font finishes loading
    const observer = new ResizeObserver(measure)
    observer.observe(bar)
    return () => observer.disconnect()
  }, [activeKey])

  return [barRef, box]
}

// The sliding highlight itself. It is mounted only once a position is known,
// so it appears in place on page load and only animates when the tab changes.
export default function TabSlider({ box, className = '' }) {
  if (!box) return null
  return (
    <span
      aria-hidden="true"
      className={`tab-slider ${className}`}
      style={{ width: box.width, transform: `translateX(${box.left}px)` }}
    />
  )
}
