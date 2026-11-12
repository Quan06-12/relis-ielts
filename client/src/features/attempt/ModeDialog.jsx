import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTestForPlay } from '../../api/tests.js'
import { startAttempt } from '../../api/attempts.js'
import { getErrorMessage } from '../../api/errorMessages.js'
import { timeChoices } from './timeOptions.js'
import './ModeDialog.css'

// "Choose mode" dialog before a test starts (US24, US25):
// full test or some sections, and how many minutes.
export default function ModeDialog({ testId, onClose }) {
  const navigate = useNavigate()
  const [test, setTest] = useState(null)
  const [isFullTest, setIsFullTest] = useState(true)
  const [chosenSections, setChosenSections] = useState([0])
  const [minutes, setMinutes] = useState(null)
  const [error, setError] = useState('')
  const [unfinishedAttemptId, setUnfinishedAttemptId] = useState(null)

  useEffect(() => {
    getTestForPlay(testId)
      .then((loadedTest) => {
        setTest(loadedTest)
        // A single-passage test has nothing to choose: it is always "some sections"
        setIsFullTest(loadedTest.kind === 'full')
      })
      .catch((loadError) => setError(getErrorMessage(loadError)))
  }, [testId])

  if (!test) {
    return <Dialog onClose={onClose}>{error ? <p className="mode-error">{error}</p> : <p>Đang tải đề…</p>}</Dialog>
  }

  const sectionIndexes = isFullTest ? test.sections.map((_, index) => index) : chosenSections
  const time = timeChoices(test.skill, isFullTest, sectionIndexes.length)
  const selectedMinutes = time.choices.includes(minutes) ? minutes : time.default
  const sectionWord = test.skill === 'reading' ? 'Passage' : 'Part'

  function toggleSection(index) {
    const next = chosenSections.includes(index) ? chosenSections.filter((item) => item !== index) : [...chosenSections, index]
    setChosenSections(next.sort((a, b) => a - b))
  }

  async function handleStart() {
    setError('')
    try {
      const mode = { type: isFullTest ? 'full' : 'parts', sectionIndexes, timeLimitMin: selectedMinutes }
      const { attempt } = await startAttempt(test.id, mode)
      navigate(`/attempts/${attempt.id}`)
    } catch (startError) {
      // An unfinished attempt already exists: offer to continue it (US33)
      if (startError.response?.data?.error?.code === 'ATTEMPT_IN_PROGRESS') {
        setUnfinishedAttemptId(startError.response.data.error.details.attemptId)
      } else {
        setError(getErrorMessage(startError))
      }
    }
  }

  return (
    <Dialog onClose={onClose}>
      <h2>{test.title}</h2>

      {test.kind === 'full' && (
        <div className="mode-choice">
          <label>
            <input type="radio" checked={isFullTest} onChange={() => setIsFullTest(true)} /> Làm full đề (có band)
          </label>
          <label>
            <input type="radio" checked={!isFullTest} onChange={() => setIsFullTest(false)} /> Luyện từng phần
          </label>
        </div>
      )}

      {!isFullTest && test.sections.length > 1 && (
        <fieldset className="mode-sections">
          <legend>Chọn phần muốn làm</legend>
          {test.sections.map((section, index) => (
            <label key={index}>
              <input type="checkbox" checked={chosenSections.includes(index)} onChange={() => toggleSection(index)} />
              {sectionWord} {index + 1} · {countQuestions(section)} câu
            </label>
          ))}
        </fieldset>
      )}

      <label className="mode-time">
        Thời gian
        <select value={selectedMinutes} onChange={(event) => setMinutes(Number(event.target.value))}>
          {time.choices.map((choice) => (
            <option key={choice} value={choice}>{choice} phút</option>
          ))}
        </select>
      </label>

      {unfinishedAttemptId && (
        <div className="mode-unfinished">
          <p>Bạn đang làm dở đề này.</p>
          <button type="button" className="primary-button" onClick={() => navigate(`/attempts/${unfinishedAttemptId}`)}>
            Làm tiếp
          </button>
        </div>
      )}

      {error && <p className="mode-error" role="alert">{error}</p>}

      <div className="dialog-actions">
        <button type="button" className="secondary-button" onClick={onClose}>Huỷ</button>
        <button type="button" className="primary-button" onClick={handleStart} disabled={sectionIndexes.length === 0}>
          Bắt đầu
        </button>
      </div>
    </Dialog>
  )
}

function countQuestions(section) {
  return section.groups.reduce((total, group) => total + group.questions.length, 0)
}

function Dialog({ children, onClose }) {
  return (
    <div className="dialog-backdrop" onClick={onClose}>
      {/* Clicks inside the dialog must not close it */}
      <div className="dialog" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}
