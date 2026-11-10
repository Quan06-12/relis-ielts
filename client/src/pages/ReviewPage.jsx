import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { reviewAttempt } from '../api/practice.js'
import { ErrorNotice, ResultSummary } from '../components/PracticeShared.jsx'

export default function ReviewPage() {
  const { attemptId } = useParams()
  const [data, setData] = useState(null),
    [error, setError] = useState(null),
    [selected, setSelected] = useState(null),
    [reload, setReload] = useState(0)
  useEffect(() => {
    let alive = true
    setData(null)
    setError(null)
    reviewAttempt(attemptId)
      .then((d) => {
        if (alive) setData(d)
      })
      .catch((e) => {
        if (alive) setError(e)
      })
    return () => {
      alive = false
    }
  }, [attemptId, reload])
  const correctness = new Map(data?.questions.map((q) => [q.questionId, q.correct]) || [])
  const values = new Map(data?.attempt.answers.map((a) => [a.questionId, a.value]) || [])
  function textWithEvidence(text, range) {
    if (
      !range ||
      !Number.isInteger(range.start) ||
      !Number.isInteger(range.end) ||
      range.start < 0 ||
      range.end <= range.start ||
      range.end > text.length
    )
      return text
    return (
      <>
        {text.slice(0, range.start)}
        <mark>{text.slice(range.start, range.end)}</mark>
        {text.slice(range.end)}
      </>
    )
  }
  return (
    <main className="page practice">
      <Link to="/history">← Lịch sử</Link>
      <h1>Xem lại bài làm</h1>
      <ErrorNotice error={error} retry={() => setReload((n) => n + 1)} />
      {!data && !error && <p role="status">Đang tải kết quả…</p>}
      {data && (
        <>
          <h2>{data.test.title}</h2>
          <ResultSummary result={data.attempt.result} />
          {data.attempt.mode.sectionIndexes.map((index) => {
            const s = data.test.sections[index],
              active = s.groups.flatMap((g) => g.questions).find((q) => q.id === selected)
            return (
              <section key={index} className="review-section">
                <h2>{s.title}</h2>
                <div className="exam-columns">
                  <article className="panel passage">
                    {data.test.skill === 'listening' && s.audioUrl && (
                      <audio
                        controls
                        preload="metadata"
                        src={s.audioUrl}
                        aria-label="Nghe lại audio"
                      />
                    )}
                    <h3>{data.test.skill === 'listening' ? 'Bản chép lời' : 'Bài đọc'}</h3>
                    <p>
                      {textWithEvidence(
                        data.test.skill === 'listening' ? s.transcript || '' : s.passage || '',
                        active?.evidence,
                      )}
                    </p>
                  </article>
                  <div className="panel">
                    {s.groups.map((g, gi) => (
                      <div key={gi}>
                        <p className="instruction">{g.instruction}</p>
                        {g.questions.map((q) => (
                          <article key={q.id} className="question">
                            <button
                              className="review-question"
                              aria-pressed={selected === q.id}
                              onClick={() => setSelected(q.id)}
                            >
                              {q.number}. {q.prompt} ·{' '}
                              <strong>{correctness.get(q.id) ? 'Đúng' : 'Sai'}</strong>
                            </button>
                            <p>
                              Bạn trả lời: <b>{values.get(q.id)?.join(', ') || 'Bỏ trống'}</b>
                            </p>
                            <p>
                              Đáp án:{' '}
                              <b>{q.answers.join(g.type === 'multi_select' ? ' + ' : ' / ')}</b>
                            </p>
                            {q.explanation?.map((step, i) => (
                              <p className="muted" key={i}>
                                {step}
                              </p>
                            ))}
                          </article>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )
          })}
        </>
      )}
    </main>
  )
}
