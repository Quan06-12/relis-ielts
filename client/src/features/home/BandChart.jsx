import { BAND_MIN, BAND_MAX, bandSeries, toPoints, bandToY } from './bandChart.js'

const WIDTH = 520
const HEIGHT = 180
const PAD = { left: 36, right: 16, top: 12, bottom: 12 }
const COLORS = { reading: '#5b3fd6', listening: '#c2410c' }
const LABELS = { reading: 'Reading', listening: 'Listening' }

// US42: band of each full test over time, one line per skill, with the goal as a dashed line.
// Drawn with plain SVG, so no chart library is needed.
export default function BandChart({ attempts, goals = {} }) {
  const series = bandSeries(attempts)
  const hasData = series.reading.length > 0 || series.listening.length > 0
  if (!hasData) {
    return <p className="home-hint">Làm full một đề 40 câu để thấy biểu đồ band ở đây.</p>
  }

  const innerWidth = WIDTH - PAD.left - PAD.right
  const innerHeight = HEIGHT - PAD.top - PAD.bottom
  const gridBands = Array.from({ length: BAND_MAX - BAND_MIN + 1 }, (_, index) => BAND_MIN + index)

  return (
    <figure className="band-chart">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="Biểu đồ band các lần làm full đề gần đây">
        <g transform={`translate(${PAD.left}, ${PAD.top})`}>
          {gridBands.map((band) => (
            <g key={band}>
              <line x1="0" x2={innerWidth} y1={bandToY(band, innerHeight)} y2={bandToY(band, innerHeight)} className="band-grid" />
              <text x="-10" y={bandToY(band, innerHeight) + 4} textAnchor="end" className="band-axis">{band.toFixed(1)}</text>
            </g>
          ))}

          {['reading', 'listening'].map((skill) => {
            const points = toPoints(series[skill], innerWidth, innerHeight)
            if (points.length === 0) return null
            return (
              <g key={skill}>
                {goals[skill] && (
                  <line
                    x1="0"
                    x2={innerWidth}
                    y1={bandToY(goals[skill], innerHeight)}
                    y2={bandToY(goals[skill], innerHeight)}
                    stroke={COLORS[skill]}
                    strokeDasharray="6 4"
                    opacity="0.5"
                  />
                )}
                <polyline points={points.map((point) => `${point.x},${point.y}`).join(' ')} fill="none" stroke={COLORS[skill]} strokeWidth="2.5" />
                {points.map((point) => (
                  <circle key={point.id} cx={point.x} cy={point.y} r="4.5" fill={COLORS[skill]}>
                    <title>{`${LABELS[skill]} ${point.band.toFixed(1)} · ${new Date(point.date).toLocaleDateString('vi-VN')}`}</title>
                  </circle>
                ))}
              </g>
            )
          })}
        </g>
      </svg>
      <figcaption className="band-legend">
        {['reading', 'listening'].map((skill) => (
          <span key={skill}>
            <i style={{ background: COLORS[skill] }} /> {LABELS[skill]}
          </span>
        ))}
        <span className="band-legend-goal">- - - mục tiêu</span>
      </figcaption>
    </figure>
  )
}
