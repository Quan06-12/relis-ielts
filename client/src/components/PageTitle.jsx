import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { titleForPath } from './pageTitle.js'

// Keeps the browser tab title in step with the current page (no visible output)
export default function PageTitle() {
  const { pathname } = useLocation()
  useEffect(() => {
    document.title = titleForPath(pathname)
  }, [pathname])
  return null
}
