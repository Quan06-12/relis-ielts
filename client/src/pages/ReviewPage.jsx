import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getReview } from '../api/attempts.js'
import { getErrorMessage } from '../api/errorMessages.js'
import { questionsOf } from '../features/attempt/answers.js'
import { formatDuration } from '../features/review/reviewHelpers.js'
import ReviewGroup from '../features/review/ReviewGroup.jsx'
import ReviewNavigator from '../features/review/ReviewNavigator.jsx'
import { scrollToQuestion } from '../features/attempt/scrollToQuestion.js'
import MarkedText from '../features/review/MarkedText.jsx'
import WordPicker from '../features/vocab/WordPicker.jsx'
import { useAiFeedback, AiFeedbackButton, AiFeedbackPanel } from '../features/review/AiFeedback.jsx'
import SplitPane from '../components/SplitPane.jsx'
import './AttemptPage.css'
import './ReviewPage.css'

// Review page (US35–US37): score summary, then every question coloured right / wrong.
// Clicking a question shows its explanation and highlights the evidence in the passage or transcript.
// Selecting words in the passage or transcript offers "Thêm vào từ vựng".
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
  const vocabSetName = `Từ vựng: ${test.title}`.slice(0, 80)

  // Open a question's explanation (from the bubble or the bottom bar); a second click closes it
  function selectQuestion(picked, { toggle = false } = {}) {
    // The groups hand over their own question objects; the full list also knows the section
    const question = allQuestions.find((item) => item.id === picked.id)
    setSelectedId(toggle && question.id === selectedId ? null : question.id)
    setCurrentSection(question.sectionPosition)
    setTimeout(() => scrollToQuestion(question.number), 0)
  }

  function pickSection(position) {
    setCurrentSection(position)
    setSelectedId(null)
  }

  const questionList = (
    <div className="attempt-questions">
      {section.groups.map((group, groupIndex) => (
        <ReviewGroup
          key={groupIndex}
          group={group}
          answerById={answerById}
          selectedId={selectedId}
          onSelect={(question) => selectQuestion(question, { toggle: true })}
        />
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

      <ScoreBox attempt={attempt} sectionCount={test.sections.length} sectionWord={sectionWord} canAskAi={viewerRole === 'owner'} />


      {test.skill === 'reading' ? (
        // US38: drag the bar to change the widths of the passage and the questions
        <main className="attempt-reading">
          <SplitPane
            label="Đổi độ rộng bài đọc và câu hỏi"
            first={
              <article className="attempt-passage">
                <h2>{section.title}</h2>
                <p className="highlight-hint">Bôi đen một từ để thêm vào từ vựng</p>
                <WordPicker text={section.passage} newSetName={vocabSetName}>
                  <MarkedText text={section.passage} evidence={evidence} />
                </WordPicker>
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
                  <WordPicker text={section.transcript} newSetName={vocabSetName}>
                    <MarkedText text={section.transcript} evidence={evidence} />
                  </WordPicker>
                </section>
              }
              second={questionList}
            />
          ) : (
            questionList
          )}
        </main>
      )}

      <ReviewNavigator
        sectionCount={test.sections.length}
        questions={allQuestions}
        answerById={answerById}
        currentSection={currentSection}
        selectedId={selectedId}
        onPickSection={pickSection}
        onPickQuestion={(question) => selectQuestion(question)}
      />

    </div>
  )
}

// Score, band and details in one foldable box (US35). The AI feedback (US49) lives in the same box:
// its button sits on the score line, and the feedback appears next to the details,
// so the passage and the questions keep most of the screen.
function ScoreBox({ attempt, sectionCount, sectionWord, canAskAi }) {
  const ai = useAiFeedback(attempt.id, attempt.feedback ?? null)
  // Open on wide screens; on a phone it starts folded to one line so the test keeps the screen
  const [startsOpen] = useState(() => window.matchMedia('(min-width: 900px)').matches)

  return (
    <details className="review-summary" open={startsOpen}>
      <summary>
        <span className="review-score">
          <strong>{attempt.result.correct}/{attempt.result.total}</strong> câu đúng
          {attempt.result.band !== null && <span className="review-band">Band {attempt.result.band.toFixed(1)}</span>}
        </span>
        {/* Only the person who took the test can ask for AI feedback */}
        {canAskAi && !ai.feedback && <AiFeedbackButton isLoading={ai.isLoading} onRequest={ai.request} />}
      </summary>

      <div className={ai.feedback ? 'review-summary-body with-ai' : 'review-summary-body'}>
        <ul>
          <li>{attempt.mode.type === 'full' ? 'Làm full đề' : `Luyện ${sectionCount} ${sectionWord.toLowerCase()}`}</li>
          <li>Thời gian làm: {formatDuration(attempt.startedAt, attempt.submittedAt)}</li>
          <li>Nộp lúc {new Date(attempt.submittedAt).toLocaleString('vi-VN')}</li>
          {attempt.result.band === null && <li>Band chỉ tính khi làm full đề 40 câu.</li>}
          <li>Bấm bong bóng cạnh đáp án để xem giải thích và bằng chứng.</li>
        </ul>
        {ai.feedback && <AiFeedbackPanel feedback={ai.feedback} />}
      </div>
      {ai.error && <p className="form-error" role="alert">{ai.error}</p>}
    </details>
  )
}

