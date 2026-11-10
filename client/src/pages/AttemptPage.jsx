import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getAttempt, saveAnswers, submitAttempt } from '../api/practice.js'
import { createAnswerQueue } from '../practice/answerQueue.js'
import { clockText } from '../practice/history.js'
import QuestionInput from '../components/QuestionInput.jsx'
import { ErrorNotice } from '../components/PracticeShared.jsx'

export default function AttemptPage() {
  const { attemptId } = useParams(),
    navigate = useNavigate()
  const [data, setData] = useState(null),
    [answers, setAnswers] = useState({}),
    [error, setError] = useState(null)
  const [seconds, setSeconds] = useState(null),
    [section, setSection] = useState(0),
    [busy, setBusy] = useState(false)
  const [saveStatus, setSaveStatus] = useState('Đã lưu'),
    [confirm, setConfirm] = useState(false),
    [reload, setReload] = useState(0)
  const queue = useRef(null),
    debounce = useRef(null),
    deadline = useRef(null),
    submitLock = useRef(false),
    autoTried = useRef(false)
  useEffect(() => {
    let alive = true
    setData(null)
    setError(null)
    autoTried.current = false
    getAttempt(attemptId)
      .then((d) => {
        if (!alive) return
        if (d.attempt.status === 'submitted') {
          navigate(`/attempts/${attemptId}/review`, { replace: true })
          return
        }
        deadline.current = Date.now() + d.attempt.remainingSec * 1000
        queue.current = createAnswerQueue((batch) =>
          saveAnswers(attemptId, batch).then((r) => {
            deadline.current = Date.now() + r.remainingSec * 1000
            return r
          }),
        )
        setAnswers(Object.fromEntries(d.attempt.answers.map((a) => [a.questionId, a.value])))
        setSection(d.attempt.mode.sectionIndexes[0])
        setSeconds(d.attempt.remainingSec)
        setData(d)
      })
      .catch((e) => {
        if (alive) setError(e)
      })
    return () => {
      alive = false
      clearTimeout(debounce.current)
    }
  }, [attemptId, navigate, reload])
  useEffect(() => {
    if (!data) return
    const tick = setInterval(
      () => setSeconds(Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000))),
      250,
    )
    const unload = (event) => {
      if (queue.current?.dirty) {
        event.preventDefault()
        event.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', unload)
    return () => {
      clearInterval(tick)
      window.removeEventListener('beforeunload', unload)
    }
  }, [data])
  const flush = useCallback(async () => {
    setSaveStatus('Đang lưu…')
    try {
      await queue.current.flush()
      setSaveStatus('Đã lưu')
      setError(null)
    } catch (e) {
      setSaveStatus('Chưa lưu được')
      setError(e)
      throw e
    }
  }, [])
  const submit = useCallback(
    async (expired = false) => {
      if (submitLock.current || !queue.current) return
      submitLock.current = true
      setBusy(true)
      clearTimeout(debounce.current)
      try {
        if (!expired) await flush()
        await submitAttempt(attemptId)
        navigate(`/attempts/${attemptId}/review`, { replace: true })
      } catch (e) {
        setError(e)
      } finally {
        submitLock.current = false
        setBusy(false)
      }
    },
    [attemptId, flush, navigate],
  )
  useEffect(() => {
    if (data && seconds === 0 && !autoTried.current) {
      autoTried.current = true
      submit(true)
    }
  }, [seconds, data, submit])
  function change(questionId, value) {
    setAnswers((old) => ({ ...old, [questionId]: value }))
    queue.current.put(questionId, value)
    setSaveStatus('Có thay đổi chưa lưu')
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => {
      flush().catch(() => {})
    }, 750)
  }
  if (!data)
    return (
      <main className="page practice">
        <Link to="/library">← Kho đề</Link>
        <ErrorNotice error={error} retry={() => setReload((n) => n + 1)} />
        {!error && <p role="status">Đang khôi phục bài làm…</p>}
      </main>
    )
  const s = data.test.sections[section],
    indexes = data.attempt.mode.sectionIndexes
  const count = indexes
    .flatMap((i) => data.test.sections[i].groups.flatMap((g) => g.questions))
    .filter((q) => answers[q.id]?.some(Boolean)).length
  return (
    <main className="practice exam">
      <header className="exam-header">
        <div>
          <span className="eyebrow">{data.test.skill}</span>
          <h1>{data.test.title}</h1>
          <span role="status">{saveStatus}</span>
        </div>
        <div className="exam-actions">
          <strong
            className={seconds <= 60 ? 'timer urgent' : 'timer'}
            aria-label="Thời gian còn lại"
          >
            {clockText(seconds)}
          </strong>
          <button
            className="primary"
            disabled={busy}
            onClick={() => (seconds === 0 ? submit(true) : setConfirm(true))}
          >
            {busy ? 'Đang nộp…' : seconds === 0 ? 'Nộp lại yêu cầu' : 'Nộp bài'}
          </button>
        </div>
      </header>
      <ErrorNotice
        error={error}
        retry={() => (seconds === 0 ? submit(true) : flush().catch(() => {}))}
      />
      {seconds === 0 && (
        <p role="status" className="notice">
          Đã hết giờ. Máy chủ chấm những đáp án đã lưu.
        </p>
      )}
      {confirm && (
        <section className="panel confirm-panel" aria-label="Xác nhận nộp bài">
          <p>Đã trả lời {count} câu. Bạn muốn nộp bài?</p>
          <button disabled={busy} className="primary" onClick={() => submit()}>
            Xác nhận nộp
          </button>
          <button disabled={busy} onClick={() => setConfirm(false)}>
            Làm tiếp
          </button>
        </section>
      )}
      <nav className="section-tabs" aria-label="Các phần">
        {indexes.map((i) => (
          <button key={i} aria-pressed={section === i} onClick={() => setSection(i)}>
            {data.test.sections[i].title || `Phần ${i + 1}`}
          </button>
        ))}
      </nav>
      <div className="exam-columns">
        <section className="panel passage">
          <h2>{s.title}</h2>
          {data.test.skill === 'listening' ? (
            s.audioUrl ? (
              <>
                <audio
                  key={s.audioUrl}
                  controls
                  preload="metadata"
                  src={s.audioUrl}
                  aria-label="Audio đề Listening"
                />
                <p className="muted">Bản chép lời sẽ xuất hiện sau khi nộp.</p>
              </>
            ) : (
              <p>Phần này chưa có audio.</p>
            )
          ) : (
            <p>{s.passage}</p>
          )}
        </section>
        <section className="panel questions">
          <h2>Câu hỏi</h2>
          {s.groups.map((g, gi) => (
            <div key={gi}>
              <p className="instruction">{g.instruction}</p>
              {g.questions.map((q) => (
                <article className="question" id={`q-${q.id}`} key={q.id}>
                  <h3>
                    {q.number}. {q.prompt}
                  </h3>
                  <QuestionInput
                    group={g}
                    question={q}
                    value={answers[q.id]}
                    onChange={(v) => change(q.id, v)}
                    disabled={busy || seconds === 0}
                  />
                </article>
              ))}
            </div>
          ))}
        </section>
      </div>
      <nav className="question-nav" aria-label="Đi đến câu hỏi">
        {s.groups
          .flatMap((g) => g.questions)
          .map((q) => (
            <a
              key={q.id}
              className={answers[q.id]?.length ? 'answered' : ''}
              href={`#q-${q.id}`}
              aria-label={`Câu ${q.number}${answers[q.id]?.length ? ', đã trả lời' : ''}`}
            >
              {q.number}
            </a>
          ))}
      </nav>
    </main>
  )
}
