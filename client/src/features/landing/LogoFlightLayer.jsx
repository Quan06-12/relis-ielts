import { useEffect, useRef, useState } from 'react'
import CubeLogo from '../../components/CubeLogo.jsx'
import './LogoFlightLayer.css'

const BIG_EDGE = 110 // cube edge (px) in the middle of the screen; drawn big so it stays sharp
const BOX = BIG_EDGE * 1.9 // the cube's box is 1.9 × its edge (CubeLogo.css)
// One turn takes SPIN_MS. The three steps add up to exactly two turns, so the cube lands
// in the same pose as the logo in the bar and nothing jumps at the end.
const SPIN_MS = 1600
const TO_MIDDLE_MS = 1500
const HOLD_MS = 400
const TO_BAR_MS = 1300 // 1500 + 400 + 1300 = 3200 = 2 × SPIN_MS

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))

// The sign-in transition (US01). It lives outside the pages, so it keeps going while the page changes:
// the Relis cube leaves the landing page, grows in the middle of the screen while the page darkens,
// the app opens behind the dark layer, then the cube shrinks into the logo of the navy bar
// and the dark layer fades. The cube tumbles calmly the whole time.
export default function LogoFlightLayer() {
  const [flight, setFlight] = useState(null) // { from, goToApp } while flying
  const cube = useRef(null)
  const backdrop = useRef(null)

  useEffect(() => {
    const start = (event) => setFlight(event.detail)
    window.addEventListener('relis:logo-flight', start)
    return () => window.removeEventListener('relis:logo-flight', start)
  }, [])

  useEffect(() => {
    if (!flight) return undefined
    let isCancelled = false
    // Hides the small cubes on the pages while the big one is in the air
    document.body.classList.add('logo-flying')

    // Where the cube's box sits (top-left corner) and how big it is, for a cube shown in `rect`
    const placeFor = (rect) => {
      const scale = rect.width / BOX
      return `translate(${rect.left + rect.width / 2 - BOX / 2}px, ${rect.top + rect.height / 2 - BOX / 2}px) scale(${scale})`
    }
    const middle = `translate(${window.innerWidth / 2 - BOX / 2}px, ${window.innerHeight / 2 - BOX / 2}px) scale(1)`
    const easing = 'cubic-bezier(0.5, 0, 0.25, 1)'

    async function fly() {
      // 1. From the landing page to the middle, the page darkens
      backdrop.current.animate([{ opacity: 0 }, { opacity: 1 }], { duration: TO_MIDDLE_MS, fill: 'forwards' })
      await cube.current.animate([{ transform: placeFor(flight.from) }, { transform: middle }], {
        duration: TO_MIDDLE_MS,
        easing,
        fill: 'forwards',
      }).finished
      if (isCancelled) return

      // 2. Rest in the middle; the app opens behind the dark layer
      flight.goToApp()
      await Promise.all([wait(HOLD_MS), nextFrame()])
      if (isCancelled) return

      // 3. Into the logo of the navy bar, the dark layer fades away
      const target = document.querySelector('.app-logo .rl-scene')
      backdrop.current.animate([{ opacity: 1 }, { opacity: 0 }], { duration: TO_BAR_MS, fill: 'forwards' })
      if (target) {
        await cube.current.animate([{ transform: middle }, { transform: placeFor(target.getBoundingClientRect()) }], {
          duration: TO_BAR_MS,
          easing,
          fill: 'forwards',
        }).finished
      } else {
        await wait(TO_BAR_MS)
      }
      if (!isCancelled) setFlight(null)
    }

    fly()
    return () => {
      isCancelled = true
      document.body.classList.remove('logo-flying')
    }
  }, [flight])

  if (!flight) return null

  return (
    <div className="logo-flight" aria-hidden="true" style={{ '--spin-ms': `${SPIN_MS}ms` }}>
      <div ref={backdrop} className="logo-flight-backdrop" />
      <div ref={cube} className="logo-flight-cube" style={{ transform: 'translate(-9999px, 0)' }}>
        <CubeLogo size={BIG_EDGE} />
      </div>
    </div>
  )
}
