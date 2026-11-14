import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getReview } from '../api/attempts.js'
import { getErrorMessage } from '../api/errorMessages.js'
import { questionsOf } from '../features/attempt/answers.js'
import { answerStatus, formatDuration } from '../features/review/reviewHelpers.js'
import ReviewQuestion from '../features/review/ReviewQuestion.jsx'
import MarkedText from '../features/review/MarkedText.jsx'
import AiFeedback from '../features/review/AiFeedback.jsx'
import SplitPane from '../components/SplitPane.jsx'
import './AttemptPage.css'
import './ReviewPage.css'

// Review page (US35–US37): score summary, then every question coloured right / wrong.
// Clicking a question shows its explanation and highlights the evidence in the passage or transcript.
export default function ReviewPage() {
  const { attemptId } = useParams()
  const navigate = useNavigate()
  const [review, setReview] = useState(null)
  const [error, setError] = useState('')
  const [currentSection, setCurrentSection] = useState(0)
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    getReview(attemptId)
      .then(setReview)
      .catch((loadError) => setError(getErrorMessage(loadError)))
  }, [attemptId])

  if (error) {
    return (
      <main className="page">
        <p className="attempt-error">{error}</p>
        <Link to="/history">← Về Lịch sử</Link>
      </main>
    )
  }
  if (!review) return <main className="page">Đang tải bài làm…</main>

  const { attempt, test, viewerRole } = review
  const answerById = new Map(attempt.answers.map((answer) => [answer.questionId, answer]))
  const allQuestions = questionsOf(test.sections)
  const section = test.sections[currentSection]
  const selected = allQuestions.find((question) => question.id === selectedId) ?? null
  // Only the evidence of the selected question is highlighted (two questions may share a passage)
  const evidence = selected && selected.sectionPosition === currentSection ? selected.evidence : null
  const sectionWord = test.skill === 'reading' ? 'Passage' : 'Part'

  function selectQuestion(question) {
    setSelectedId(question.id)
    setCurrentSection(question.sectionPosition)
    setTimeout(() => document.getElementById(`question-${question.number}`)?.scrollIntoView({ block: 'center' }), 0)
  }

  const questionList = (
    <div className="attempt-questions">
      {section.groups.map((group, groupIndex) => (
        <section key={groupIndex} className="question-group">
          <p className="question-instruction">{group.instruction}</p>
          {group.questions.map((question) => (
            <ReviewQuestion
              key={question.id}
              question={question}
              answer={answerById.get(question.id)}
              isSelected={question.id === selectedId}
              onSelect={() => setSelectedId(question.id)}
            />
          ))}
        </section>
      ))}
    </div>
  )

  return (
    <div className="attempt-page">
      <header className="attempt-header">
        <h1>{test.title}</h1>
        {viewerRole === 'teacher' && <span className="review-chip">Giáo viên · chỉ xem</span>}
        {/* A teacher came from the gradebook, so "Exit" goes back there; a student goes to their history */}
        {viewerRole === 'teacher' ? (
          <button type="button" className="secondary-button" onClick={() => navigate(-1)}>Thoát</button>
        ) : (
          <Link to="/history" className="secondary-button">Thoát</Link>
        )}
      </header>

      {/* Score summary, folded into one line instead of a separate result page (US35) */}
      <details className="review-summary" open>
        <summary>
          <strong>{attempt.result.correct}/{attempt.result.total}</strong> câu đúng
          {attempt.result.band !== null && <span className="review-band">Band {attempt.result.band.toFixed(1)}</span>}
        </summary>
        <ul>
          <li>{attempt.mode.type === 'full' ? 'Làm full đề' : `Luyện ${test.sections.length} ${sectionWord.toLowerCase()}`}</li>
          <li>Thời gian làm: {formatDuration(attempt.startedAt, attempt.submittedAt)}</li>
          <li>Nộp lúc {new Date(attempt.submittedAt).toLocaleString('vi-VN')}</li>
          {attempt.result.band === null && <li>Band chỉ tính khi làm full đề 40 câu.</li>}
        </ul>
      </details>

      {/* Only the person who took the test can ask for AI feedback (US49) */}
      {viewerRole === 'owner' && <AiFeedback attemptId={attempt.id} initialFeedback={attempt.feedback ?? null} />}

      {selected === null && <p className="review-hint">Bấm vào một câu để xem giải thích và vị trí bằng chứng.</p>}

      {test.sections.length > 1 && (
        <nav className="section-tabs">
          {test.sections.map((item, position) => (
            <button
              key={item.index}
              type="button"
              className={position === currentSection ? 'section-tab active' : 'section-tab'}
              onClick={() => setCurrentSection(position)}
            >
              {item.title || `${sectionWord} ${item.index + 1}`}
            </button>
          ))}
        </nav>
      )}

      {test.skill === 'reading' ? (
        // US38: drag the bar to change the widths of the passage and the questions
        <main className="attempt-reading">
          <SplitPane
            label="Đổi độ rộng bài đọc và câu hỏi"
            first={
              <article className="attempt-passage">
                <h2>{section.title}</h2>
                <MarkedText text={section.passage} evidence={evidence} />
              </article>
            }
            second={questionList}
          />
        </main>
      ) : (
        <main className="attempt-listening">
          {section.audioUrl && <audio key={section.audioUrl} className="attempt-audio" src={section.audioUrl} controls preload="metadata" />}
          {section.transcript ? (
            // US38: drag the bar to change the heights of the transcript and the questions
            <SplitPane
              direction="rows"
              label="Đổi chiều cao transcript và câu hỏi"
              first={
                <section className="review-transcript">
                  <h3>Transcript</h3>
                  <MarkedText text={section.transcript} evidence={evidence} />
                </section>
              }
              second={questionList}
            />
          ) : (
            questionList
          )}
        </main>
      )}

      {/* Navigator: green = right, red = wrong, grey = left empty */}
      <footer className="question-navigator">
        {allQuestions.map((question) => (
          <button
            key={question.id}
            type="button"
            className={`navigator-dot review-${answerStatus(answerById.get(question.id))}`}
            onClick={() => selectQuestion(question)}
          >
            {question.number}
          </button>
        ))}
      </footer>

    </div>
  )
}

