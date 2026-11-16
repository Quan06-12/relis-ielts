import { splitGap, groupHeading, isGapGroup } from '../attempt/questionText.js'
import { answerStatus } from './reviewHelpers.js'

// One group on the review page, laid out like the test itself:
// gaps show "my answer → right answer", options show the right one in green and a wrong choice in red.
// The bubble button opens the explanation and highlights the evidence in the passage (US36, US37).
export default function ReviewGroup({ group, answerById, selectedId, onSelect }) {
  return (
    <section className="question-group">
      <h3 className="question-heading">{groupHeading(group.questions)}</h3>
      <p className="question-instruction">{group.instruction}</p>

      {isGapGroup(group.type) ? (
        <div className="notes-box">
          <ul>
            {group.questions.map((question) => (
              <li key={question.id} id={`question-${question.number}`}>
                <ReviewGapLine question={question} answer={answerById.get(question.id)} onSelect={() => onSelect(question)} />
                {question.id === selectedId && <Explanation question={question} />}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        group.questions.map((question) => (
          <div key={question.id} id={`question-${question.number}`} className={question.id === selectedId ? 'question selected' : 'question'}>
            <p className="question-prompt">
              <span className={`question-number ${answerStatus(answerById.get(question.id))}`}>{question.number}</span> {question.prompt}
            </p>
            <ReviewOptions question={question} answer={answerById.get(question.id)} onSelect={() => onSelect(question)} />
            {question.id === selectedId && <Explanation question={question} />}
          </div>
        ))
      )}
    </section>
  )
}

// "... supplied with ink by a (1) garhg → reservoir 💬"
function ReviewGapLine({ question, answer, onSelect }) {
  const { before, after } = splitGap(question.prompt)
  const status = answerStatus(answer)
  const given = (answer?.value ?? []).join(', ')
  return (
    <>
      {before}
      <span className={`gap-result ${status}`}>
        <span className={`question-number ${status}`}>{question.number}</span>
        {status === 'correct' && <span className="gap-right">{given}</span>}
        {status === 'wrong' && <s className="gap-wrong">{given}</s>}
        {status === 'blank' && <span className="gap-wrong" aria-label="Bỏ trống">×</span>}
        {status !== 'correct' && (
          <>
            <span className="gap-arrow" aria-hidden="true">→</span>
            <span className="gap-right">{question.answers[0]}</span>
          </>
        )}
        <EvidenceButton onClick={onSelect} number={question.number} />
      </span>
      {after}
    </>
  )
}

// Option rows: the right option in green, my wrong choice in red; the bubble sits next to the right option
function ReviewOptions({ question, answer, onSelect }) {
  const chosen = answer?.value ?? []
  const accepted = question.answers.map((item) => item.trim().toLowerCase())
  return (
    <div className="option-rows review">
      {question.options.map((option) => {
        const isRight = accepted.includes(option.trim().toLowerCase())
        const isChosen = chosen.includes(option)
        const classes = ['option-row']
        if (isRight) classes.push('right')
        if (isChosen && !isRight) classes.push('wrong')
        if (isChosen) classes.push('chosen')
        return (
          <div key={option} className={classes.join(' ')}>
            <span className="option-dot" aria-hidden="true" />
            <span className="option-text">
              {option}
              {isChosen && <span className="visually-hidden"> (bạn chọn)</span>}
            </span>
            {isRight && <EvidenceButton onClick={onSelect} number={question.number} />}
          </div>
        )
      })}
    </div>
  )
}

function EvidenceButton({ onClick, number }) {
  return (
    <button type="button" className="evidence-button" onClick={onClick} aria-label={`Xem giải thích và bằng chứng câu ${number}`} title="Xem giải thích và bằng chứng">
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path d="M12 3C6.9 3 3 6.4 3 10.6c0 2.3 1.2 4.4 3.1 5.8L5.5 20l3.9-2.2c.8.2 1.7.3 2.6.3 5.1 0 9-3.4 9-7.5S17.1 3 12 3z" fill="currentColor" />
        <circle cx="11.2" cy="10.2" r="2.6" fill="none" stroke="#fff" strokeWidth="1.6" />
        <path d="M13.2 12.2l2 2" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </button>
  )
}

function Explanation({ question }) {
  return (
    <div className="review-explanation">
      <p className="review-answer-line">Đáp án: <strong>{question.answers.join(' / ')}</strong></p>
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
  )
}
