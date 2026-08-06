/**
 * Painted bay markings in ground-plane perspective, sitting along the bottom
 * of the hero. Replaces the earlier diagonal stripes, which were decoration
 * that meant nothing — this is the subject's own vernacular: white paint on
 * asphalt, seen from a driver's eye height.
 *
 * Lines are generated rather than hand-written so the spacing stays even.
 */

const VP = { x: 600, y: 40 } // vanishing point
const BASE_Y = 320 // bottom edge
const STOP_Y = 128 // lines fade out before reaching the vanishing point

function toward(x0, y1) {
  const t = (BASE_Y - y1) / (BASE_Y - VP.y)
  return { x: x0 + (VP.x - x0) * t, y: y1 }
}

export default function BayLines() {
  const starts = []
  for (let x = -520; x <= 1720; x += 160) starts.push(x)

  return (
    <svg
      className="hero__bays"
      viewBox="0 0 1200 320"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      {/* bay dividers running away from the viewer */}
      {starts.map((x0) => {
        const end = toward(x0, STOP_Y)
        return (
          <line
            key={x0}
            x1={x0}
            y1={BASE_Y}
            x2={end.x}
            y2={end.y}
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="round"
          />
        )
      })}

      {/* the two painted bay ends crossing them */}
      {[168, 236].map((y) => {
        const a = toward(-520, y)
        const b = toward(1720, y)
        return (
          <line
            key={y}
            x1={a.x}
            y1={y}
            x2={b.x}
            y2={y}
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="round"
          />
        )
      })}
    </svg>
  )
}
