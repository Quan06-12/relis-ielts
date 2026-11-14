import { useState } from 'react'
import FileUploadButton from './FileUploadButton.jsx'
import { evidenceFromSelection, evidenceSnippet } from './evidence.js'
import { paragraphRanges, paragraphSegments, sectionMarks } from './passageView.js'

// Left half of the editor (wireframe): the passage or transcript of the selected section.
// "Gắn bằng chứng" shows the text as the student sees it; select words, then attach them to the open question.
// "Sửa đoạn văn" shows the plain fields to type or paste the text (and upload audio for Listening).
export default function PassagePane({ test, sectionIndex, onSelectSection, numbers, activeQuestion, onChangeSection, onAttach }) {
  const [mode, setMode] = useState('evidence') // 'evidence' | 'edit'
  const [selection, setSelection] = useState(null) // { start, end } in the text
  const section = test.sections[sectionIndex]
  const isReading = test.skill === 'reading'
  const text = isReading ? section.passage : section.transcript
  const sectionWord = isReading ? 'Passage' : 'Part'

  function selectSection(index) {
    setSelection(null)
    onSelectSection(index)
  }

  // Turns the browser selection into offsets in the text. Every piece of text is a <span data-start>,
  // so an offset is "where the span starts" + "how far into the span".
  function readSelection() {
    const browserSelection = window.getSelection()
    if (!browserSelection.rangeCount || browserSelection.isCollapsed) {
      setSelection(null)
      return
    }
    const range = browserSelection.getRangeAt(0)
    const start = offsetIn(range.startContainer, range.startOffset)
    const end = offsetIn(range.endContainer, range.endOffset)
    setSelection(start === null || end === null ? null : evidenceFromSelection(text, Math.min(start, end), Math.max(start, end)))
  }

  function attach() {
    onAttach(selection)
    setSelection(null)
    window.getSelection().removeAllRanges()
  }

  const marks = sectionMarks(section, numbers)

  return (
    <div className="passage-pane">
      <div className="passage-toolbar">
        <div className="passage-tabs">
          {test.sections.map((item, index) => (
            <button
              key={index}
              type="button"
              className={index === sectionIndex ? 'passage-tab active' : 'passage-tab'}
              onClick={() => selectSection(index)}
            >
              {`${sectionWord} ${index + 1}`}
            </button>
          ))}
        </div>
        <div className="segmented" role="tablist">
          <button type="button" role="tab" aria-selected={mode === 'evidence'} className={mode === 'evidence' ? 'segmented-tab active' : 'segmented-tab'} onClick={() => setMode('evidence')}>
            Gắn bằng chứng
          </button>
          <button type="button" role="tab" aria-selected={mode === 'edit'} className={mode === 'edit' ? 'segmented-tab active' : 'segmented-tab'} onClick={() => setMode('edit')}>
            {isReading ? 'Sửa đoạn văn' : 'Sửa audio & transcript'}
          </button>
        </div>
      </div>

      <div className="passage-scroll">
        {mode === 'edit' ? (
          <div className="passage-edit">
            <label className="editor-field">
              Tiêu đề
              <input type="text" value={section.title} onChange={(event) => onChangeSection({ title: event.target.value })} />
            </label>
            {!isReading && (
              <div className="editor-field">
                Audio
                <div className="audio-row">
                  {section.audioUrl && <audio src={section.audioUrl} controls preload="metadata" />}
                  <FileUploadButton
                    kind="audio"
                    accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/aac"
                    label={section.audioUrl ? 'Đổi audio' : 'Tải audio lên (mp3, m4a, tối đa 30 MB)'}
                    onUploaded={({ url, durationSec }) => onChangeSection({ audioUrl: url, audioDurationSec: durationSec })}
                  />
                </div>
              </div>
            )}
            <label className="editor-field">
              {isReading ? 'Nội dung passage' : 'Transcript'} <small>(mỗi dòng là một đoạn{isReading ? ', tự đánh A, B, C…' : ', chỉ hiện ở trang Xem lại'})</small>
              <textarea
                rows={22}
                value={text}
                onChange={(event) => onChangeSection(isReading ? { passage: event.target.value } : { transcript: event.target.value })}
              />
            </label>
          </div>
        ) : (
          <>
            <div className="evidence-banner">
              {activeQuestion ? (
                <>
                  <p>
                    Đang gắn bằng chứng cho <strong>Câu {activeQuestion.number}</strong>: bôi đen câu hoặc cụm từ chứa đáp án, rồi bấm
                    &quot;Gắn vào câu {activeQuestion.number}&quot;. Gạch chấm là bằng chứng của các câu khác.
                  </p>
                  {selection && (
                    <div className="evidence-banner-action">
                      <span>“{evidenceSnippet(text, selection, 80)}”</span>
                      <button type="button" className="editor-button primary" onClick={attach}>Gắn vào câu {activeQuestion.number}</button>
                    </div>
                  )}
                </>
              ) : (
                <p>Mở một câu hỏi ở bên phải để gắn bằng chứng cho câu đó. Gạch chấm là bằng chứng đã gắn.</p>
              )}
            </div>

            {!isReading && section.audioUrl && <audio className="passage-audio" src={section.audioUrl} controls preload="metadata" />}

            {text.trim() === '' ? (
              <p className="passage-empty">
                Chưa có {isReading ? 'nội dung passage' : 'transcript'}. Bấm &quot;{isReading ? 'Sửa đoạn văn' : 'Sửa audio & transcript'}&quot; để dán vào.
              </p>
            ) : (
              <article className="passage-view" onMouseUp={readSelection} onKeyUp={readSelection}>
                <h2>{section.title || `${sectionWord} ${sectionIndex + 1}`}</h2>
                {paragraphRanges(text, isReading).map((paragraph) => (
                  <div key={paragraph.start} className="passage-paragraph">
                    {paragraph.label && <span className="paragraph-label">{paragraph.label}</span>}
                    <p>
                      {paragraphSegments(paragraph, marks).map((segment) => (
                        <span
                          key={segment.start}
                          data-start={segment.start}
                          className={segmentClass(segment, activeQuestion)}
                          title={segment.numbers.length ? `Bằng chứng câu ${segment.numbers.join(', ')}` : undefined}
                        >
                          {segment.text}
                        </span>
                      ))}
                    </p>
                  </div>
                ))}
              </article>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// Offset in the passage for a point of the browser selection, or null when it is outside the text spans
function offsetIn(node, offset) {
  const element = node.nodeType === Node.TEXT_NODE ? node.parentElement : node
  const span = element?.closest?.('[data-start]')
  if (!span) return null
  const spanStart = Number(span.dataset.start)
  // The point is inside the span's text, or (for an element) at its start or end
  if (node.nodeType === Node.TEXT_NODE) return spanStart + offset
  return offset === 0 ? spanStart : spanStart + span.textContent.length
}

function segmentClass(segment, activeQuestion) {
  if (segment.numbers.length === 0) return undefined
  return activeQuestion && segment.numbers.includes(activeQuestion.number) ? 'evidence-mark active' : 'evidence-mark'
}
