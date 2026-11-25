import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getAttempt, saveAnswers, submitAttempt } from '../api/attempts.js'
import { getErrorMessage } from '../api/errorMessages.js'
import { useCountdown } from '../features/attempt/useCountdown.js'
import { questionsOf, countUnanswered, formatClock } from '../features/attempt/answers.js'
import QuestionGroup from '../features/attempt/QuestionGroup.jsx'
import PartNavigator from '../features/attempt/PartNavigator.jsx'
import { scrollToQuestion } from '../features/attempt/scrollToQuestion.js'
import AudioPlayer from '../features/attempt/AudioPlayer.jsx'
import SplitPane from '../components/SplitPane.jsx'
import { backupPending, loadPending, clearPending } from '../features/attempt/pendingBackup.js'
import HighlightablePassage from '../features/attempt/HighlightablePassage.jsx'
import { loadHighlights, saveHighlights, clearHighlights, loadNotes, saveNotes, clearNotes } from '../features/attempt/highlights.js'
import './AttemptPage.css'

const AUTOSAVE_DELAY_MS = 1000
// In the last seconds, answers are saved immediately: the server rejects answers after the deadline
const FINAL_SECONDS = 5

// Taking a test (US27–US32, US43): passage or audio, questions, countdown, autosave, highlights, notes and submit.
export default function AttemptPage() {
  const { attemptId } = useParams()
  const navigate = useNavigate()

  const [test, setTest] = useState(null)
  const [sections, setSections] = useState([])          // only the sections chosen in the dialog
  const [answers, setAnswers] = useState({})            // { questionId: ["value"] }
  const [initialSeconds, setInitialSeconds] = useState(null)
  const [currentSection, setCurrentSection] = useState(0)
  const [currentNumber, setCurrentNumber] = useState(1) // the question being worked on, boxed in the bottom bar
  const [isConfirmingSubmit, setIsConfirmingSubmit] = useState(false)
  const [error, setError] = useState('')
  // US43: { [section position]: [{ start, end }] }, kept in the browser for this attempt
  const [highlights, setHighlights] = useState(() => loadHighlights(attemptId))
  // Notes on words of the passage: { [section position]: [{ start, end, text }] }, kept the same way
  const [notes, setNotes] = useState(() => loadNotes(attemptId))

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
          clearHighlights(attemptId)
          clearNotes(attemptId)
          goToReview()
          return
        }
        // US33: answers chosen just before a reload may not have reached the server yet;
        // they wait in the browser, are shown again, and are sent now
        const notYetSaved = loadPending(attemptId)
        pendingChanges.current = notYetSaved

        const chosenSections = attempt.mode.sectionIndexes.map((index) => loadedTest.sections[index])
        setTest(loadedTest)
        setSections(chosenSections)
        setCurrentNumber(questionsOf(chosenSections)[0]?.number ?? 1)
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
      clearHighlights(attemptId)
      clearNotes(attemptId)
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
    setCurrentNumber(question.number)
    // Wait for the section to render before scrolling to the question and putting the cursor in it
    setTimeout(() => {
      scrollToQuestion(question.number)
      document.getElementById(`question-${question.number}`)?.querySelector('input')?.focus({ preventScroll: true })
    }, 0)
  }

  // Another part from the bottom bar: show it from its first question
  function pickSection(position) {
    const first = allQuestions.find((question) => question.sectionPosition === position)
    if (first) jumpToQuestion(first)
  }

  function handleHighlightsChange(ranges) {
    const next = { ...highlights, [currentSection]: ranges }
    setHighlights(next)
    saveHighlights(attemptId, next)
  }

  function handleNotesChange(sectionNotes) {
    const next = { ...notes, [currentSection]: sectionNotes }
    setNotes(next)
    saveNotes(attemptId, next)
  }

  const groupProps = { answers, onAnswer: handleAnswer, onFocusQuestion: (question) => setCurrentNumber(question.number) }

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


      {test.skill === 'reading' ? (
        // US27: passage on the left, questions on the right, each scrolls on its own;
        // US38: the bar between them can be dragged
        <main className="attempt-reading">
          <SplitPane
            label="Đổi độ rộng bài đọc và câu hỏi"
            first={
              // US43: select words in the passage to highlight them
              <HighlightablePassage
                key={currentSection}
                title={section.title}
                passage={section.passage}
                ranges={highlights[currentSection] ?? []}
                notes={notes[currentSection] ?? []}
                onChange={handleHighlightsChange}
                onNotesChange={handleNotesChange}
              />
            }
            second={
              <div className="attempt-questions">
                {section.groups.map((group, index) => (
                  <QuestionGroup key={index} group={group} {...groupProps} />
                ))}
              </div>
            }
          />
        </main>
      ) : (
        // US28, US29: audio player with play, pause, seek and speed, then the questions
        <main className="attempt-listening">
          {section.audioUrl ? (
            <AudioPlayer src={section.audioUrl} />
          ) : (
            <p className="attempt-error">Phần này chưa có audio.</p>
          )}
          <div className="attempt-questions">
            {section.groups.map((group, index) => (
              <QuestionGroup key={index} group={group} {...groupProps} />
            ))}
          </div>
        </main>
      )}

      <PartNavigator
        sections={sections}
        sectionWord={sectionWord}
        questions={allQuestions}
        answers={answers}
        currentSection={currentSection}
        currentNumber={currentNumber}
        onPickSection={pickSection}
        onPickQuestion={jumpToQuestion}
        onSubmit={() => setIsConfirmingSubmit(true)}
      />

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
