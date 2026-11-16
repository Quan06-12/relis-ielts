import { sectionProgress } from '../attempt/questionText.js'
import { answerStatus } from './reviewHelpers.js'

// Bottom bar of the review page: one box per part with every number coloured
// (green = right, red = wrong or empty). The current part has a coloured border; arrows move between parts.
export default function ReviewNavigator({ sectionCount, questions, answerById, currentSection, selectedId, onPickSection, onPickQuestion }) {
  return (
    <footer className="review-navigator">
      <div className="review-parts">
        {Array.from({ length: sectionCount }, (_, position) => {
          const { questions: inPart } = sectionProgress(questions, position, () => false)
          return (
            <div key={position} className={position === currentSection ? 'review-part current' : 'review-part'}>
              {inPart.map((question) => {
                const status = answerStatus(answerById.get(question.id))
                return (
                  <button
                    key={question.id}
                    type="button"
                    className={`review-number ${status === 'correct' ? 'correct' : 'wrong'}${question.id === selectedId ? ' selected' : ''}`}
                    onClick={() => onPickQuestion(question)}
                    aria-label={`Câu ${question.number}: ${status === 'correct' ? 'đúng' : status === 'wrong' ? 'sai' : 'bỏ trống'}`}
                  >
                    {question.number}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>

      {sectionCount > 1 && (
        <div className="review-arrows">
          <button type="button" onClick={() => onPickSection(currentSection - 1)} disabled={currentSection === 0} aria-label="Phần trước">‹</button>
          <button type="button" onClick={() => onPickSection(currentSection + 1)} disabled={currentSection === sectionCount - 1} aria-label="Phần sau">›</button>
        </div>
      )}
    </footer>
  )
}
