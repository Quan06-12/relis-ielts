import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Opening another page starts at its top. The browser does not do this by itself in a single-page app,
// so without it a page could open half-way down, where the previous page was scrolled to.
export default function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}
