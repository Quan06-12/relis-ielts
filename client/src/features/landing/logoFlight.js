// Starts the sign-in logo flight (see LogoFlightLayer.jsx) from any page.
// from: the box of the small cube where the flight begins; goToApp: changes page half-way.
export function startLogoFlight(from, goToApp) {
  window.dispatchEvent(new CustomEvent('relis:logo-flight', { detail: { from, goToApp } }))
}
