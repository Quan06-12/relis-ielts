import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getAttempt, saveAnswers, submitAttempt } from '../api/attempts.js'
import { getErrorMessage } from '../api/errorMessages.js'
import { useCountdown } from '../features/attempt/useCountdown.js'
import { questionsOf, isAnswered, countUnanswered, formatClock } from '../features/attempt/answers.js'
import QuestionGroup from '../features/attempt/QuestionGroup.jsx'
import { backupPending, loadPending, clearPending } from '../features/attempt/pendingBackup.js'
import './AttemptPage.css'

const AUTOSAVE_DELAY_MS = 1000
// In the last seconds, answers are saved immediately: the server rejects answers after the deadline
const FINAL_SECONDS = 5

// Taking a test (US27–US32): passage or audio, questions, countdown, autosave and submit.
export default function AttemptPage() {
  const { attemptId } = useParams()
  const navigate = useNavigate()

  const [test, setTest] = useState(null)
  const [sections, setSections] = useState([])          // only the sections chosen in the dialog
  const [answers, setAnswers] = useState({})            // { questionId: ["value"] }
  const [initialSeconds, setInitialSeconds] = useState(null)
  const [currentSection, setCurrentSection] = useState(0)
  const [isConfirmingSubmit, setIsConfirmingSubmit] = useState(false)
  const [error, setError] = useState('')

  // Answers changed since the last autosave
  const pendingChanges = useRef({})
  const autosaveTimer = useRef(null)
  const isSubmitting = useRef(false)
  const secondsLeftNow = useRef(null)

  const goToReview = useCallback(() => navigate(`/attempts/${attemptId}/review`, { replace: true }), [navigate, attemptId])

  // Send the pending answers now (used by autosave and before submitting)
  const flushAnswers = useCallback(async () => {
    clearTimeout(autosaveTimer.current)
    const sending = pendingChanges.current
    const changes = Object.entries(sending).map(([questionId, value]) => ({ questionId, value }))
    if (changes.length === 0) return
    pendingChanges.current = {}
    try {
      await saveAnswers(attemptId, changes)
    } catch (saveError) {
      // Not saved: put the answers back (newer changes win) so the next autosave retries them
      pendingChanges.current = { ...sending, ...pendingChanges.current }
      throw saveError
    }
    // Answers changed while saving stay in the backup; otherwise it is no longer needed
    backupPending(attemptId, pendingChanges.current)
  }, [attemptId])

  // Load the attempt (also used after a reload: answers and time continue where they were)
  useEffect(() => {
    getAttempt(attemptId)
      .then(({ attempt, test: loadedTest }) => {
        if (attempt.status === 'submitted') {
          clearPending(attemptId)
          goToReview()
          return
        }
        // US33: answers chosen just before a reload may not have reached the server yet;
        // they wait in the browser, are shown again, and are sent now
        const notYetSaved = loadPending(attemptId)
        pendingChanges.current = notYetSaved

        setTest(loadedTest)
        setSections(attempt.mode.sectionIndexes.map((index) => loadedTest.sections[index]))
        setAnswers({
          ...Object.fromEntries(attempt.answers.map((answer) => [answer.questionId, answer.value])),
          ...notYetSaved,
        })
        setInitialSeconds(attempt.remainingSec)
        if (Object.keys(notYetSaved).length > 0) {
          flushAnswers().catch((saveError) => setError(getErrorMessage(saveError)))
        }
      })
      .catch((loadError) => setError(getErrorMessage(loadError)))
  }, [attemptId, goToReview, flushAnswers])

  function handleAnswer(questionId, value) {
    setAnswers((current) => ({ ...current, [questionId]: value }))
    pendingChanges.current[questionId] = value
    backupPending(attemptId, pendingChanges.current)
    const isAlmostTimeUp = secondsLeftNow.current !== null && secondsLeftNow.current <= FINAL_SECONDS
    clearTimeout(autosaveTimer.current)
    autosaveTimer.current = setTimeout(() => {
      flushAnswers().catch((saveError) => setError(getErrorMessage(saveError)))
    }, isAlmostTimeUp ? 0 : AUTOSAVE_DELAY_MS)
  }

  const handleSubmit = useCallback(async () => {
    if (isSubmitting.current) return
    isSubmitting.current = true
    try {
      // If saving fails because time is up, the server has already closed the attempt; submit anyway
      await flushAnswers().catch(() => {})
      await submitAttempt(attemptId)
      clearPending(attemptId)
      goToReview()
    } catch (submitError) {
      isSubmitting.current = false
      setError(getErrorMessage(submitError))
    }
  }, [attemptId, flushAnswers, goToReview])

  // US31: when the clock reaches zero the test is handed in automatically
  const secondsLeft = useCountdown(initialSeconds, handleSubmit)
  secondsLeftNow.current = secondsLeft

  if (error && !test) return <p className="page">{error}</p>
  if (!test) return <p className="page">Đang tải bài làm…</p>

  const allQuestions = questionsOf(sections)
  const unanswered = countUnanswered(allQuestions, answers)
  const section = sections[currentSection]
  const sectionWord = test.skill === 'reading' ? 'Passage' : 'Part'

  function jumpToQuestion(question) {
    setCurrentSection(question.sectionPosition)
    // Wait for the section to render before scrolling to the question
    setTimeout(() => document.getElementById(`question-${question.number}`)?.scrollIntoView({ block: 'center' }), 0)
  }

  return (
    <div className="attempt-page">
      <header className="attempt-header">
        <h1>{test.title}</h1>
        <span className={secondsLeft <= 300 ? 'attempt-clock warning' : 'attempt-clock'} aria-live="polite">
          {formatClock(secondsLeft ?? 0)}
        </span>
        <button type="button" className="submit-button" onClick={() => setIsConfirmingSubmit(true)}>
          Nộp bài
        </button>
      </header>

      {error && <p className="attempt-error" role="alert">{error}</p>}

      {sections.length > 1 && (
        <nav className="section-tabs">
          {sections.map((item, position) => (
            <button
              key={position}
              type="button"
              className={position === currentSection ? 'section-tab active' : 'section-tab'}
              onClick={() => setCurrentSection(position)}
            >
              {item.title || `${sectionWord} ${position + 1}`}
            </button>
          ))}
        </nav>
      )}

      {test.skill === 'reading' ? (
        // US27: passage on the left, questions on the right, each scrolls on its own
        <main className="attempt-reading">
          <article className="attempt-passage">
            <h2>{section.title}</h2>
            {section.passage.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </article>
          <div className="attempt-questions">
            {section.groups.map((group, index) => (
              <QuestionGroup key={index} group={group} answers={answers} onAnswer={handleAnswer} />
            ))}
          </div>
        </main>
      ) : (
        // US28: audio player with play, pause and seek, then the questions
        <main className="attempt-listening">
          {section.audioUrl ? (
            <audio key={section.audioUrl} className="attempt-audio" src={section.audioUrl} controls preload="auto" />
          ) : (
            <p className="attempt-error">Phần này chưa có audio.</p>
          )}
          <div className="attempt-questions">
            {section.groups.map((group, index) => (
              <QuestionGroup key={index} group={group} answers={answers} onAnswer={handleAnswer} />
            ))}
          </div>
        </main>
      )}

      {/* Question navigator: answered questions are filled in */}
      <footer className="question-navigator">
        {allQuestions.map((question) => (
          <button
            key={question.id}
            type="button"
            className={isAnswered(answers[question.id]) ? 'navigator-dot answered' : 'navigator-dot'}
            onClick={() => jumpToQuestion(question)}
          >
            {question.number}
          </button>
        ))}
      </footer>

      {/* US32: confirm before handing in early, showing how many questions are empty */}
      {isConfirmingSubmit && (
        <div className="dialog-backdrop" onClick={() => setIsConfirmingSubmit(false)}>
          <div className="dialog" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <h2>Nộp bài?</h2>
            <p>{unanswered > 0 ? `Bạn còn ${unanswered} câu chưa trả lời.` : 'Bạn đã trả lời tất cả các câu.'}</p>
            <div className="dialog-actions">
              <button type="button" className="secondary-button" onClick={() => setIsConfirmingSubmit(false)}>
                Làm tiếp
              </button>
              <button type="button" className="primary-button" onClick={handleSubmit}>
                Nộp bài
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
