import { useState } from 'react'
import { requestFeedback } from '../../api/attempts.js'
import { getErrorMessage } from '../../api/errorMessages.js'
import CubeLogo from '../../components/CubeLogo.jsx'

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

// "Nhận xét bằng AI" in the score line, with the Relis cube: it tumbles once on hover and keeps
// turning while the AI is writing. It sits inside <summary>, so the click must not fold the box.
export function AiFeedbackButton({ isLoading, onRequest }) {
  return (
    <button
      type="button"
      className={isLoading ? 'primary-button ai-feedback-button rl-spin loading' : 'primary-button ai-feedback-button rl-spin'}
      disabled={isLoading}
      aria-busy={isLoading}
      onClick={(event) => {
        event.preventDefault()
        onRequest()
      }}
    >
      <CubeLogo size={12} />
      {isLoading ? 'AI đang nhận xét…' : 'Nhận xét bằng AI'}
    </button>
  )
}

export function AiFeedbackPanel({ feedback }) {
  return (
    <section className="ai-feedback">
      <h2><CubeLogo size={12} tone="violet" /> Nhận xét AI</h2>
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
