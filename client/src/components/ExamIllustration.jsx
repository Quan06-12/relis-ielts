// Drawing for the login page (wireframe): a reading passage, an answer sheet, a listening card and a pencil.
// Plain SVG shapes, no photos, so it stays sharp at any size.
export default function ExamIllustration() {
  const passageLines = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
  const answers = ['TRUE', 'NOT GIVEN', 'FALSE', 'C', 'iv', 'B', 'green roofs', '1960s', 'D', 'vii']

  return (
    <svg className="exam-illustration" viewBox="0 0 420 300" role="img" aria-label="Đề Reading, phiếu trả lời và đề Listening">
      {/* Reading passage */}
      <g transform="rotate(-6 110 130)">
        <rect x="30" y="30" width="160" height="210" rx="6" fill="#fff" />
        <text x="44" y="50" fontSize="6" fill="#8a84a3" fontWeight="700">IELTS ACADEMIC</text>
        <text x="160" y="50" fontSize="6" fill="#8a84a3" fontWeight="700">READING</text>
        <text x="44" y="64" fontSize="7" fill="#1a1530" fontWeight="700">READING PASSAGE 1</text>
        <text x="44" y="78" fontSize="9" fill="#1a1530" fontFamily="Georgia, serif" fontWeight="700">Gardens on the Rooftops</text>
        {passageLines.map((line) => (
          <rect key={line} x="44" y={90 + line * 13} width={line % 3 === 2 ? 100 : 132} height="4" rx="2" fill={line === 3 ? '#ffe27a' : line === 6 ? '#d9d2ff' : '#e4e0ef'} />
        ))}
      </g>

      {/* Answer sheet */}
      <g transform="rotate(5 280 120)">
        <rect x="205" y="20" width="150" height="200" rx="6" fill="#fff" />
        <text x="218" y="38" fontSize="7" fill="#1a1530" fontWeight="700">IELTS Answer Sheet</text>
        <text x="320" y="38" fontSize="6" fill="#c62828" fontWeight="700">READING</text>
        <line x1="218" y1="44" x2="342" y2="44" stroke="#c62828" strokeWidth="1" />
        {answers.map((answer, index) => (
          <g key={answer} transform={`translate(0 ${index * 16})`}>
            <text x="220" y="60" fontSize="6" fill="#8a84a3">{index + 1}</text>
            <rect x="230" y="53" width="86" height="10" rx="2" fill="#f4f2fa" />
            <text x="234" y="60.5" fontSize="6" fill="#1a1530" fontFamily="Georgia, serif">{answer}</text>
            <circle cx="332" cy="58" r="3.5" fill={index % 4 === 2 ? '#fff' : '#1a1530'} stroke="#1a1530" strokeWidth="0.8" />
          </g>
        ))}
      </g>

      {/* Listening card */}
      <g transform="rotate(-4 120 240)">
        <rect x="40" y="180" width="120" height="88" rx="8" fill="#fff" />
        <rect x="40" y="180" width="120" height="52" rx="8" fill="#fbe6d9" />
        <rect x="40" y="220" width="120" height="12" fill="#fbe6d9" />
        <path d="M86 214v-8a14 14 0 0 1 28 0v8M86 214a3 3 0 0 0 3 3h2v-9h-2a3 3 0 0 0-3 3zm28 0a3 3 0 0 1-3 3h-2v-9h2a3 3 0 0 1 3 3z" fill="none" stroke="#c2410c" strokeWidth="2.2" strokeLinecap="round" />
        <rect x="40" y="226" width="44" height="11" rx="2" fill="#c2410c" />
        <text x="44" y="234" fontSize="6" fill="#fff" fontWeight="700">Part 2</text>
        <text x="48" y="250" fontSize="7" fill="#1a1530" fontWeight="700">Booking an Art Course</text>
        <text x="48" y="260" fontSize="6" fill="#8a84a3">Form completion</text>
      </g>

      {/* Pencil */}
      <g transform="rotate(-28 300 250)">
        <rect x="230" y="244" width="120" height="12" rx="2" fill="#ffc531" />
        <rect x="340" y="244" width="14" height="12" fill="#f28b9b" />
        <rect x="334" y="244" width="6" height="12" fill="#c9c3d9" />
        <path d="M230 244l-16 6 16 6z" fill="#f1d7a8" />
        <path d="M218 248.5l-4 1.5 4 1.5z" fill="#1a1530" />
      </g>
    </svg>
  )
}
