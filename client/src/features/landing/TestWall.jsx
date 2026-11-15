import { useState } from 'react'
import { wallCards } from './wall.js'
import TestIllustration from './TestIllustration.jsx'
import './TestWall.css'

// Few, big cards that cover the whole half of the screen, like the reference
const COLUMNS = 6
const ROWS = 5

// The still, tilted 3D wall of IELTS test cards on the landing page (decoration only).
export default function TestWall() {
  const cards = wallCards(COLUMNS, ROWS)

  return (
    <div className="wall-viewport" aria-hidden="true">
      <div className="wall-plane">
        {Array.from({ length: COLUMNS }, (_, column) => (
          <div key={column} className={column % 2 ? 'wall-column offset' : 'wall-column'}>
            {cards
              .filter((card) => card.column === column)
              .map((card) => (
                <div key={card.key} className="wall-card">
                  <WallCard test={card.test} />
                </div>
              ))}
          </div>
        ))}
      </div>
      <div className="wall-fade" />
    </div>
  )
}

// One card: a full-bleed photo like a magazine cover, with the test name over it.
// The photo is /landing/<scene>.jpg (client/public/landing); if it fails to load, a drawing stands in.
function WallCard({ test }) {
  const [hasPhoto, setHasPhoto] = useState(true)

  return (
    <>
      {hasPhoto ? (
        <img className="wall-photo" src={`/landing/${test.scene}.jpg`} alt="" draggable="false" onError={() => setHasPhoto(false)} />
      ) : (
        <div className="wall-photo">
          <TestIllustration scene={test.scene} />
        </div>
      )}
      <div className="wall-card-top">
        <span>IELTS {test.skill === 'reading' ? 'READING' : 'LISTENING'}</span>
        <span className={`wall-part ${test.skill}`}>{test.part}</span>
      </div>
      <p className="wall-title">{test.title}</p>
    </>
  )
}
