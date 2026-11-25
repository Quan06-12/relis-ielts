import { useState } from 'react'
import { requestFeedback } from '../../api/attempts.js'
import { getErrorMessage } from '../../api/errorMessages.js'

// AI feedback on the review page (US49). The feedback is made once on the server and stored,
// so after the first time it simply comes back with the review.
// The button sits in the score line and the feedback inside the score box (ReviewPage).
export function useAiFeedback(attemptId, initialFeedback) {
  const [feedback, setFeedback] = useState(initialFeedback)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function request() {
    setIsLoading(true)
    setError('')
    try {
      setFeedback(await requestFeedback(attemptId))
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setIsLoading(false)
    }
  }

  return { feedback, isLoading, error, request }
}

// A sparkle drawn as SVG (the same stroke as the other icons), used for the AI feedback
function AiIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" />
    </svg>
  )
}

// "Nhận xét bằng AI" in the score line. It sits inside <summary>, so the click must not fold the box.
export function AiFeedbackButton({ isLoading, onRequest }) {
  return (
    <button
      type="button"
      className="primary-button ai-feedback-button"
      disabled={isLoading}
      onClick={(event) => {
        event.preventDefault()
        onRequest()
      }}
    >
      {isLoading ? <span className="ai-spinner" aria-hidden="true" /> : <AiIcon />}
      {isLoading ? 'AI đang nhận xét…' : 'Nhận xét bằng AI'}
    </button>
  )
}

export function AiFeedbackPanel({ feedback }) {
  return (
    <section className="ai-feedback">
      <h2><AiIcon /> Nhận xét AI</h2>
      <p>{feedback.summary}</p>
      {feedback.weakTypes.length > 0 && (
        <p>
          <strong>Dạng câu cần luyện thêm:</strong> {feedback.weakTypes.join(', ')}
        </p>
      )}
      {feedback.tips.length > 0 && (
        <ul>
          {feedback.tips.map((tip, index) => (
            <li key={index}>{tip}</li>
          ))}
        </ul>
      )}
      <p className="ai-feedback-note">Nhận xét do AI tạo, chỉ để tham khảo.</p>
    </section>
  )
}
