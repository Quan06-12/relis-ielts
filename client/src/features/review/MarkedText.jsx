import { splitByEvidence } from './reviewHelpers.js'

// A passage or transcript with the evidence of the selected question in yellow (US37).
// Line breaks typed in the editor are kept with `white-space: pre-wrap`.
export default function MarkedText({ text, evidence }) {
  const parts = splitByEvidence(text, evidence)

  if (!parts) {
    return <div className="marked-text">{text}</div>
  }

  return (
    <div className="marked-text">
      {parts.before}
      <mark ref={(element) => element?.scrollIntoView({ block: 'center', behavior: 'smooth' })}>{parts.marked}</mark>
      {parts.after}
    </div>
  )
}
