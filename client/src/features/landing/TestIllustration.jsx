// Small flat drawings for the test cards on the landing page, one per topic (scene).
// Plain SVG shapes: sharp at any size, nothing to download, no copyright on photos.
// Every scene is drawn in a 120 × 80 box.

const SCENES = {
  rooftop: (
    <>
      <rect width="120" height="80" fill="#cfe8ff" />
      <circle cx="96" cy="16" r="9" fill="#ffd45a" />
      <rect x="8" y="34" width="34" height="46" fill="#8a94b8" />
      <rect x="46" y="22" width="40" height="58" fill="#6c76a0" />
      <rect x="90" y="40" width="26" height="40" fill="#9aa3c4" />
      {[0, 1, 2, 3].map((row) => [0, 1, 2].map((col) => <rect key={`${row}${col}`} x={52 + col * 11} y={34 + row * 11} width="6" height="6" fill="#dfe6ff" />))}
      <path d="M44 22c4-9 10-9 14 0 4-9 10-9 14 0 4-9 10-9 16 0z" fill="#3fa34d" />
      <path d="M6 34c3-6 8-6 11 0 3-6 8-6 11 0 3-6 8-6 15 0z" fill="#58b85c" />
    </>
  ),
  lighthouse: (
    <>
      <rect width="120" height="80" fill="#ffd9b0" />
      <rect y="56" width="120" height="24" fill="#3d7bd6" />
      <path d="M0 60q10-4 20 0t20 0 20 0 20 0 20 0 20 0" fill="none" stroke="#cfe2ff" strokeWidth="1.5" />
      <path d="M40 56l26-12 30 12z" fill="#6b5b4d" />
      <path d="M60 50l3-34h8l3 34z" fill="#fff" />
      <rect x="61.5" y="26" width="11" height="5" fill="#e04848" />
      <rect x="60.5" y="38" width="13" height="5" fill="#e04848" />
      <rect x="62" y="10" width="10" height="7" fill="#ffd45a" />
      <path d="M72 13l40-8v16z" fill="#fff3b0" opacity="0.7" />
    </>
  ),
  bees: (
    <>
      <rect width="120" height="80" fill="#fff1c2" />
      {[[30, 30], [48, 30], [39, 45], [57, 45], [21, 45], [30, 60], [48, 60]].map(([x, y]) => (
        <path key={`${x}${y}`} d={`M${x} ${y - 9}l8 4.5v9l-8 4.5-8-4.5v-9z`} fill="#f6b71d" stroke="#d48e00" strokeWidth="1" />
      ))}
      <ellipse cx="88" cy="34" rx="9" ry="6" fill="#ffcf33" />
      <path d="M84 29v10M88 28v12M92 29v10" stroke="#2b2238" strokeWidth="2" />
      <ellipse cx="85" cy="25" rx="5" ry="3.5" fill="#e8f2ff" opacity="0.9" />
      <ellipse cx="92" cy="25" rx="5" ry="3.5" fill="#e8f2ff" opacity="0.9" />
      <path d="M97 34q8 4 14-4" fill="none" stroke="#d48e00" strokeDasharray="2 2" />
    </>
  ),
  mountains: (
    <>
      <rect width="120" height="80" fill="#bfe3f5" />
      <circle cx="24" cy="18" r="8" fill="#ffd45a" />
      <path d="M0 64l30-38 22 26 18-20 30 32z" fill="#6d8fb8" />
      <path d="M30 26l-8 10h16zM70 32l-6 7h12z" fill="#fff" />
      <path d="M0 80V62q30-8 60 0t60-2v20z" fill="#5fae5a" />
      <circle cx="78" cy="66" r="5" fill="none" stroke="#2b2238" strokeWidth="1.6" />
      <circle cx="94" cy="66" r="5" fill="none" stroke="#2b2238" strokeWidth="1.6" />
      <path d="M78 66l6-8h8l2 8M84 58l-2-3h-3" fill="none" stroke="#e04848" strokeWidth="1.6" />
    </>
  ),
  ocean: (
    <>
      <rect width="120" height="80" fill="#0f4c81" />
      <rect width="120" height="30" fill="#7cc4ff" />
      <path d="M0 30q15-5 30 0t30 0 30 0 30 0v6H0z" fill="#1e6bb0" />
      <circle cx="30" cy="52" r="3" fill="#a8dcff" opacity="0.7" />
      <circle cx="40" cy="60" r="2" fill="#a8dcff" opacity="0.7" />
      <path d="M70 58q10-8 22 0-12 8-22 0zM92 58l7-5v10z" fill="#ffb347" />
      <path d="M10 80q4-14 8 0M20 80q5-18 10 0" fill="#3fa36b" />
      <text x="84" y="22" fontSize="9" fill="#0f4c81" fontWeight="700">CO₂</text>
    </>
  ),
  recycling: (
    <>
      <rect width="120" height="80" fill="#dff3e4" />
      <g fill="none" stroke="#2e8b57" strokeWidth="5" strokeLinecap="round">
        <path d="M48 24l12-8 12 8" />
        <path d="M78 34l2 14-10 8" />
        <path d="M44 58l-10-8 4-14" />
      </g>
      <path d="M56 13l6 3-6 3zM84 50l-6 4 1-7zM31 40l1-7 5 5z" fill="#2e8b57" />
      <rect x="88" y="52" width="20" height="22" rx="2" fill="#3d7bd6" />
      <rect x="12" y="56" width="16" height="18" rx="2" fill="#f6b71d" />
    </>
  ),
  night: (
    <>
      <rect width="120" height="80" fill="#1d1a4a" />
      {[[10, 10], [30, 22], [52, 8], [70, 18], [88, 6], [104, 24], [20, 36], [96, 40]].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="1.3" fill="#fff" />
      ))}
      <circle cx="84" cy="22" r="10" fill="#fff3c4" />
      <circle cx="88" cy="19" r="9" fill="#1d1a4a" />
      <path d="M0 80V58h14V46h12v12h10V40h14v18h12V50h16v30z" fill="#0e0c2a" />
      {[[18, 50], [42, 46], [42, 54], [66, 56], [82, 60]].map(([x, y]) => (
        <rect key={`${x}${y}`} x={x} y={y} width="3" height="3" fill="#ffd45a" />
      ))}
      <path d="M78 80l14-26 14 26z" fill="#ffd45a" opacity="0.18" />
    </>
  ),
  coins: (
    <>
      <rect width="120" height="80" fill="#f3ead6" />
      <rect x="18" y="20" width="56" height="32" rx="3" fill="#7fb48a" stroke="#4d8a5c" strokeWidth="1.5" />
      <circle cx="46" cy="36" r="9" fill="none" stroke="#4d8a5c" strokeWidth="1.5" />
      <text x="42" y="40" fontSize="11" fill="#4d8a5c" fontWeight="700">£</text>
      {[0, 1, 2, 3].map((index) => (
        <ellipse key={index} cx="90" cy={62 - index * 6} rx="14" ry="5" fill="#f6b71d" stroke="#c98a00" strokeWidth="1" />
      ))}
      <ellipse cx="66" cy="66" rx="10" ry="4" fill="#d9d9d9" stroke="#a0a0a0" strokeWidth="1" />
    </>
  ),
  desert: (
    <>
      <rect width="120" height="80" fill="#ffe0c2" />
      <circle cx="92" cy="20" r="11" fill="#ff9a3c" />
      <path d="M0 80V58q30-14 60 0t60-4v26z" fill="#e9b26b" />
      <path d="M0 80V66q40-10 80 2t40-4v16z" fill="#d89a52" />
      <path d="M34 64V34a5 5 0 0 1 10 0v30M34 48h-6a4 4 0 0 1-4-4v-6M44 44h6a4 4 0 0 0 4-4v-8" fill="none" stroke="#3f8f4a" strokeWidth="6" strokeLinecap="round" />
      <path d="M8 28q20-6 40 2t40-2" fill="none" stroke="#fff" strokeWidth="3" opacity="0.7" strokeLinecap="round" />
    </>
  ),
  art: (
    <>
      <rect width="120" height="80" fill="#efe6ff" />
      <path d="M30 18c22-10 50 0 52 18 1 10-10 10-14 16s4 14-8 16c-24 4-44-10-44-28 0-10 6-18 14-22z" fill="#fff" stroke="#c9b8f0" strokeWidth="1.5" />
      <circle cx="36" cy="32" r="5" fill="#e04848" />
      <circle cx="50" cy="24" r="5" fill="#ffd45a" />
      <circle cx="66" cy="28" r="5" fill="#3d7bd6" />
      <circle cx="34" cy="48" r="5" fill="#3fa34d" />
      <path d="M86 70l22-50" stroke="#8a5a2b" strokeWidth="4" strokeLinecap="round" />
      <path d="M106 24l4-8-1 9z" fill="#5b3fd6" />
    </>
  ),
}

export default function TestIllustration({ scene }) {
  return (
    <svg viewBox="0 0 120 80" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {SCENES[scene] ?? SCENES.rooftop}
    </svg>
  )
}
