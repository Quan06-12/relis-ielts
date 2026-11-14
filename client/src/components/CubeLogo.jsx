import './CubeLogo.css'

const FACES = ['front', 'right', 'back', 'left', 'top', 'bottom']

// Relis logo from the wireframe: a thin-line 3D cube with a hatched front face, drawn with CSS 3D.
// When the mouse is over (or keyboard focus is on) an ancestor with class "rl-spin",
// it tumbles one full turn around a tilted, screen-diagonal axis.
// size: length of one edge in pixels. tone: 'light' (white lines on purple) or 'violet' (purple lines on white).
export default function CubeLogo({ size = 20, tone = 'light' }) {
  return (
    <span className="rl-scene" style={{ '--s': `${size}px` }} aria-hidden="true">
      <span className={`rl-cube rl-${tone}`}>
        {FACES.map((face) => (
          <span key={face} className={`rl-face rl-${face}`} />
        ))}
      </span>
    </span>
  )
}
