import { sectionProgress } from './questionText.js'
import { isAnswered } from './answers.js'

// Bottom bar while taking a test, as in the computer-delivered IELTS:
// the current part lists its question numbers, the other parts only show "0 of 13".
// Answered numbers are underlined, the question being worked on is boxed.
export default function PartNavigator({ sections, sectionWord, questions, answers, currentSection, currentNumber, onPickSection, onPickQuestion, onSubmit }) {
  return (
    <footer className="part-navigator">
      {sections.map((section, position) => {
        const { questions: inPart, answered } = sectionProgress(questions, position, (question) => isAnswered(answers[question.id]))
        const label = `${sectionWord} ${position + 1}`

        if (position !== currentSection) {
          return (
            <button key={position} type="button" className="part-segment" onClick={() => onPickSection(position)}>
              <strong>{label}</strong>
              <span>{answered} of {inPart.length}</span>
            </button>
          )
        }

        return (
          <div key={position} className="part-segment current">
            <strong>{label}</strong>
            <div className="part-numbers">
              {inPart.map((question) => {
                const classes = ['part-number']
                if (isAnswered(answers[question.id])) classes.push('answered')
                if (question.number === currentNumber) classes.push('current')
                return (
                  <button key={question.id} type="button" className={classes.join(' ')} onClick={() => onPickQuestion(question)} aria-label={`Câu ${question.number}`}>
                    {question.number}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      <button type="button" className="part-submit" onClick={onSubmit} aria-label="Nộp bài" title="Nộp bài">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {/* On phones the header has no room for "Nộp bài", so the label lives here */}
        <span className="part-submit-label">Nộp bài</span>
      </button>
    </footer>
  )
}
