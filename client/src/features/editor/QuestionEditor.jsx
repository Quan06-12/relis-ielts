import { isTextType, hasFixedOptions } from './editorState.js'
import { evidenceFromSelection, evidenceSnippet, isEvidenceOutOfRange } from './evidence.js'

// One question: prompt, options, correct answer(s), explanation steps (US16, US17)
// and the evidence in the passage or transcript (US18).
export default function QuestionEditor({ type, question, number, evidenceSource, onChange, onRemove }) {
  const isMultiple = type === 'multi_select'
  const { text = '', selection = null, label = 'passage' } = evidenceSource ?? {}
  const selected = selection ? evidenceFromSelection(text, selection.start, selection.end) : null

  function toggleAnswer(option) {
    if (isMultiple) {
      const answers = question.answers.includes(option)
        ? question.answers.filter((answer) => answer !== option)
        : [...question.answers, option]
      onChange({ answers })
    } else {
      onChange({ answers: [option] })
    }
  }

  function renameOption(index, newText) {
    const oldText = question.options[index]
    const options = question.options.map((option, position) => (position === index ? newText : option))
    // Keep the correct answer pointing at the renamed option
    const answers = question.answers.map((answer) => (answer === oldText ? newText : answer))
    onChange({ options, answers })
  }

  function removeOption(index) {
    const removed = question.options[index]
    onChange({
      options: question.options.filter((_, position) => position !== index),
      answers: question.answers.filter((answer) => answer !== removed),
    })
  }

  return (
    <div className="question-editor">
      <div className="question-editor-header">
        <span className="question-badge">Câu {number}</span>
        <button type="button" className="link-button danger" onClick={onRemove}>Xoá câu</button>
      </div>

      <label className="editor-field">
        Đề bài
        <textarea rows={2} value={question.prompt} onChange={(event) => onChange({ prompt: event.target.value })} />
      </label>

      {isTextType(type) ? (
        <label className="editor-field">
          Đáp án đúng <small>(mỗi dòng một cách viết được chấp nhận, ví dụ "10" và "ten")</small>
          <textarea
            rows={2}
            value={question.answers.join('\n')}
            onChange={(event) => onChange({ answers: event.target.value.split('\n') })}
          />
        </label>
      ) : (
        <fieldset className="editor-field options-editor">
          <legend>
            Lựa chọn · bấm ô bên trái để đánh dấu đáp án đúng{isMultiple ? ' (chọn được nhiều)' : ''}
          </legend>
          {question.options.map((option, index) => (
            <div key={index} className="option-row">
              <input
                type={isMultiple ? 'checkbox' : 'radio'}
                name={`answer-${question.id ?? question.key}`}
                checked={question.answers.includes(option)}
                onChange={() => toggleAnswer(option)}
                aria-label={`Đáp án đúng: ${option}`}
              />
              {hasFixedOptions(type) ? (
                <span>{option}</span>
              ) : (
                <>
                  <input type="text" value={option} onChange={(event) => renameOption(index, event.target.value)} />
                  <button type="button" className="link-button" onClick={() => removeOption(index)}>Bỏ</button>
                </>
              )}
            </div>
          ))}
          {!hasFixedOptions(type) && (
            <button type="button" className="link-button" onClick={() => onChange({ options: [...question.options, ''] })}>
              + Thêm lựa chọn
            </button>
          )}
        </fieldset>
      )}

      <div className="editor-field evidence-field">
        <span>
          Bằng chứng <small>(bôi đen một đoạn trong {label} ở trên, rồi bấm "Gắn đoạn đang chọn"; hiện tô vàng ở trang Xem lại)</small>
        </span>
        {question.evidence ? (
          <blockquote className={isEvidenceOutOfRange(text, question.evidence) ? 'evidence-quote broken' : 'evidence-quote'}>
            {isEvidenceOutOfRange(text, question.evidence)
              ? `${label} đã bị sửa ngắn lại, hãy gắn lại bằng chứng`
              : `“${evidenceSnippet(text, question.evidence)}”`}
          </blockquote>
        ) : (
          <p className="evidence-empty">Chưa gắn bằng chứng.</p>
        )}
        <div className="evidence-actions">
          <button type="button" className="editor-button" disabled={!selected} onClick={() => onChange({ evidence: selected })}>
            Gắn đoạn đang chọn
          </button>
          {question.evidence && (
            <button type="button" className="link-button" onClick={() => onChange({ evidence: null })}>Bỏ bằng chứng</button>
          )}
        </div>
      </div>

      <label className="editor-field">
        Giải thích <small>(mỗi dòng một bước, hiện ở trang Xem lại)</small>
        <textarea
          rows={3}
          value={question.explanation.join('\n')}
          onChange={(event) => onChange({ explanation: event.target.value.split('\n') })}
        />
      </label>
    </div>
  )
}
