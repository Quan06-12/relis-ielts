import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { playTest, startAttempt } from '../api/practice.js'
import { ErrorNotice } from './PracticeShared.jsx'

export default function StartAttempt({ testId, onClose }) {
  const navigate = useNavigate()
  const [test, setTest] = useState(null),
    [error, setError] = useState(null),
    [busy, setBusy] = useState(false)
  const [mode, setMode] = useState('full'),
    [parts, setParts] = useState([]),
    [minutes, setMinutes] = useState(60)
  const [resumeId, setResumeId] = useState(null)
  useEffect(() => {
    let alive = true
    playTest(testId)
      .then(({ test }) => {
        if (!alive) return
        setTest(test)
        setMinutes(test.durationMin || 60)
        setParts(test.sections.map((_, i) => i))
        setMode(test.kind === 'full' ? 'full' : 'parts')
      })
      .catch((err) => {
        if (alive) setError(err)
      })
    return () => {
      alive = false
    }
  }, [testId])
  async function begin(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const { attempt } = await startAttempt({
        testId,
        mode: {
          type: mode,
          sectionIndexes: mode === 'full' ? test.sections.map((_, i) => i) : parts,
          timeLimitMin: Number(minutes),
        },
      })
      navigate(`/attempts/${attempt.id}`)
    } catch (err) {
      setError(err)
      setResumeId(err.response?.data?.error?.details?.attemptId || null)
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="panel mode-panel" aria-labelledby="mode-title">
      <div className="section-heading">
        <h2 id="mode-title">Chọn chế độ làm bài</h2>
        <button onClick={onClose}>Đóng</button>
      </div>
      <ErrorNotice error={error} />
      {!test && !error && <p role="status">Đang đọc đề…</p>}
      {test && (
        <form onSubmit={begin}>
          <h3>{test.title}</h3>
          <label>
            Chế độ
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              {test.kind === 'full' && <option value="full">Toàn bộ đề</option>}
              <option value="parts">Theo từng phần</option>
            </select>
          </label>
          {mode === 'parts' && (
            <fieldset>
              <legend>Phần muốn làm</legend>
              {test.sections.map((s, i) => (
                <label className="check-row" key={i}>
                  <input
                    type="checkbox"
                    checked={parts.includes(i)}
                    onChange={(e) =>
                      setParts(e.target.checked ? [...parts, i] : parts.filter((n) => n !== i))
                    }
                  />
                  {s.title || `Phần ${i + 1}`}
                </label>
              ))}
            </fieldset>
          )}
          <label>
            Thời gian (phút)
            <input
              type="number"
              min="1"
              max="180"
              required
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
            />
          </label>
          {test.skill === 'listening' &&
            parts.some((i) => test.sections[i].audioDurationSec > minutes * 60) && (
              <p className="notice">Audio dài hơn thời gian đã chọn.</p>
            )}
          <p className="muted">
            Đáp án được tự lưu. Hết giờ, bài được nộp với những đáp án máy chủ đã nhận.
          </p>
          <button className="primary" disabled={busy || (mode === 'parts' && !parts.length)}>
            {busy ? 'Đang bắt đầu…' : 'Bắt đầu làm bài'}
          </button>
          {resumeId && (
            <button type="button" onClick={() => navigate(`/attempts/${resumeId}`)}>
              Tiếp tục bài đang làm
            </button>
          )}
        </form>
      )}
    </section>
  )
}
