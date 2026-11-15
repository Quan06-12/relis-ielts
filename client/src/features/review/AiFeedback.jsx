import { useState } from 'react'
import { requestFeedback } from '../../api/attempts.js'
import { getErrorMessage } from '../../api/errorMessages.js'

// AI feedback box on the review page (US49). The feedback is made once on the server and stored,
// so after the first time it simply comes back with the review.
// On a phone the review page has little height, so the feedback starts folded and the questions stay visible
const startsOpen = () => typeof window === 'undefined' || window.matchMedia('(min-width: 900px)').matches

export default function AiFeedback({ attemptId, initialFeedback }) {
  const [feedback, setFeedback] = useState(initialFeedback)
  const [isOpen] = useState(startsOpen)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRequest() {
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

  if (!feedback) {
    return (
      <section className="ai-feedback">
        <p>Nhận xét từ AI dựa trên số câu đúng của từng dạng câu hỏi.</p>
        <button type="button" className="primary-button" onClick={handleRequest} disabled={isLoading}>
          {isLoading ? 'AI đang nhận xét…' : '✨ Nhận xét bằng AI'}
        </button>
        {error && <p className="form-error" role="alert">{error}</p>}
      </section>
    )
  }

  return (
    <details className="ai-feedback" open={isOpen}>
      <summary>
        <h2>✨ Nhận xét AI</h2>
      </summary>
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
    </details>
  )
}
