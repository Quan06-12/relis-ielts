import { answerStatus, formatValue } from './reviewHelpers.js'

const STATUS_LABEL = { correct: 'Đúng', wrong: 'Sai', blank: 'Bỏ trống' }

// One question on the review page (US36, US37): my answer coloured right / wrong,
// the accepted answers, and the step-by-step explanation once the question is selected.
export default function ReviewQuestion({ question, answer, isSelected, onSelect }) {
  const status = answerStatus(answer)

  return (
    <div
      id={`question-${question.number}`}
      className={`question review-question ${status}${isSelected ? ' selected' : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => event.key === 'Enter' && onSelect()}
    >
      <p className="question-prompt">
        <span className="question-number">{question.number}</span> {question.prompt}
      </p>

      <p className="review-line">
        <span className={`review-status ${status}`}>{STATUS_LABEL[status]}</span>
        Bạn chọn: <strong>{formatValue(answer?.value)}</strong>
      </p>
      {status !== 'correct' && (
        <p className="review-line">
          Đáp án: <strong>{question.answers.join(' / ')}</strong>
        </p>
      )}

      {isSelected && (
        <div className="review-explanation">
          {question.explanation.length > 0 ? (
            <ol>
              {question.explanation.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          ) : (
            <p>Câu này chưa có giải thích.</p>
          )}
          {!question.evidence && <p className="review-muted">Chưa đánh dấu vị trí bằng chứng trong bài.</p>}
        </div>
      )}
    </div>
  )
}
