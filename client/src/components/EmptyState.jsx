import './EmptyState.css'

// Friendly empty screen with a small drawing, a sentence and an optional action.
// kind: "classes" | "history" | "lost"
export default function EmptyState({ kind = 'history', title, children }) {
  return (
    <div className="empty-state">
      <Drawing kind={kind} />
      <h2>{title}</h2>
      {children && <div className="empty-state-text">{children}</div>}
    </div>
  )
}

// Simple drawings made of shapes, in the app's colours
function Drawing({ kind }) {
  if (kind === 'classes') {
    return (
      <svg viewBox="0 0 120 90" width="120" height="90" aria-hidden="true">
        <rect x="10" y="20" width="100" height="58" rx="8" fill="#e6e9fb" />
        <rect x="22" y="32" width="46" height="6" rx="3" fill="#283593" />
        <rect x="22" y="44" width="70" height="5" rx="2.5" fill="#c3caee" />
        <rect x="22" y="54" width="58" height="5" rx="2.5" fill="#c3caee" />
        <circle cx="94" cy="20" r="12" fill="#ffc531" />
        <path d="M89 20h10M94 15v10" stroke="#141b3d" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    )
  }
  if (kind === 'lost') {
    return (
      <svg viewBox="0 0 120 90" width="140" height="105" aria-hidden="true">
        <circle cx="52" cy="42" r="26" fill="#e6e9fb" stroke="#283593" strokeWidth="5" />
        <path d="M71 61l20 20" stroke="#283593" strokeWidth="8" strokeLinecap="round" />
        <text x="52" y="51" textAnchor="middle" fontSize="26" fontWeight="700" fill="#283593">?</text>
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 120 90" width="120" height="90" aria-hidden="true">
      <rect x="28" y="10" width="64" height="72" rx="8" fill="#e6e9fb" />
      <rect x="40" y="24" width="40" height="5" rx="2.5" fill="#283593" />
      <rect x="40" y="36" width="32" height="5" rx="2.5" fill="#c3caee" />
      <rect x="40" y="48" width="36" height="5" rx="2.5" fill="#c3caee" />
      <circle cx="86" cy="66" r="14" fill="#ffc531" />
      <path d="M86 59v8l5 3" stroke="#141b3d" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  )
}
