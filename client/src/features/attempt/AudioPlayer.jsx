import { useRef, useState } from 'react'

export const SPEEDS = [1, 1.25, 1.5, 2]

// Audio for a Listening part (US28) with speed buttons (US29).
// The chosen speed stays when moving to another part, because the browser resets it for each new file.
export default function AudioPlayer({ src }) {
  const audio = useRef(null)
  const [speed, setSpeed] = useState(1)

  function changeSpeed(newSpeed) {
    setSpeed(newSpeed)
    if (audio.current) audio.current.playbackRate = newSpeed
  }

  return (
    <div className="audio-player">
      <audio
        key={src}
        ref={audio}
        className="attempt-audio"
        src={src}
        controls
        preload="auto"
        onLoadedMetadata={(event) => {
          event.currentTarget.playbackRate = speed
        }}
      />
      <div className="audio-speeds" role="group" aria-label="Tốc độ audio">
        {SPEEDS.map((value) => (
          <button
            key={value}
            type="button"
            className={value === speed ? 'speed-button active' : 'speed-button'}
            aria-pressed={value === speed}
            onClick={() => changeSpeed(value)}
          >
            {value.toFixed(value % 1 === 0 ? 1 : 2)}x
          </button>
        ))}
      </div>
    </div>
  )
}
