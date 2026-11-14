import { isTextType, hasFixedOptions } from './editorState.js'
import { evidenceSnippet, isEvidenceOutOfRange } from './evidence.js'
import { answerSummary, shortPrompt } from './passageView.js'

// One question (US16, US17, US18). Closed: a one-line row with its answer and evidence.
// Open: prompt, options and correct answer(s), evidence (attached from the passage on the left)
// and the explanation steps.
export default function QuestionEditor({ type, question, number, isOpen, onToggle, evidenceText, evidenceLabel, onChange, onRemove }) {
  const isMultiple = type === 'multi_select'
  const answer = answerSummary(question)
  const brokenEvidence = isEvidenceOutOfRange(evidenceText, question.evidence)

  function toggleAnswer(option) {
    if (isMultiple) {
      const answers = question.answers.includes(option)
        ? question.answers.filter((item) => item !== option)
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
    const answers = question.answers.map((item) => (item === oldText ? newText : item))
    onChange({ options, answers })
  }

  function removeOption(index) {
    const removed = question.options[index]
    onChange({
      options: question.options.filter((_, position) => position !== index),
      answers: question.answers.filter((item) => item !== removed),
    })
  }

  return (
    <div className={isOpen ? 'question-editor open' : 'question-editor'}>
      <button type="button" className="question-row" onClick={onToggle} aria-expanded={isOpen}>
        <span className="question-number">{number}</span>
        <span className="question-row-prompt">{shortPrompt(question.prompt)}</span>
        {answer ? <span className="row-chip answer">Đáp án: {answer}</span> : <span className="row-chip missing">Chưa có đáp án</span>}
        {question.evidence && <span className={brokenEvidence ? 'row-chip missing' : 'row-chip evidence'}>▮ Bằng chứng</span>}
      </button>

      {isOpen && (
        <div className="question-body">
          <label className="editor-field">
            Nội dung câu hỏi
            <textarea rows={2} value={question.prompt} onChange={(event) => onChange({ prompt: event.target.value })} autoFocus={question.prompt === ''} />
          </label>

          {isTextType(type) ? (
            <label className="editor-field">
              Đáp án đúng <small>(mỗi dòng một cách viết được chấp nhận, ví dụ &quot;10&quot; và &quot;ten&quot;)</small>
              <textarea rows={2} value={question.answers.join('\n')} onChange={(event) => onChange({ answers: event.target.value.split('\n') })} />
            </label>
          ) : hasFixedOptions(type) ? (
            <div className="editor-field">
              Đáp án đúng
              <div className="answer-pills">
                {question.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={question.answers.includes(option) ? 'answer-pill selected' : 'answer-pill'}
                    aria-pressed={question.answers.includes(option)}
                    onClick={() => toggleAnswer(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <fieldset className="editor-field options-editor">
              <legend>Lựa chọn · bấm ô bên trái để đánh dấu đáp án đúng{isMultiple ? ' (chọn được nhiều)' : ''}</legend>
              {question.options.map((option, index) => (
                <div key={index} className="option-row">
                  <input
                    type={isMultiple ? 'checkbox' : 'radio'}
                    name={`answer-${question.id ?? question.key}`}
                    checked={question.answers.includes(option)}
                    onChange={() => toggleAnswer(option)}
                    aria-label={`Đáp án đúng: ${option}`}
                  />
                  <input type="text" value={option} onChange={(event) => renameOption(index, event.target.value)} />
                  <button type="button" className="link-button" onClick={() => removeOption(index)}>Bỏ</button>
                </div>
              ))}
              <button type="button" className="link-button" onClick={() => onChange({ options: [...question.options, ''] })}>
                + Thêm lựa chọn
              </button>
            </fieldset>
          )}

          <div className="editor-field">
            Bằng chứng <small>(bôi đen trong {evidenceLabel} bên trái rồi bấm &quot;Gắn vào câu {number}&quot;; tô vàng ở trang Xem lại)</small>
            {question.evidence ? (
              <div className="evidence-attached">
                <blockquote className={brokenEvidence ? 'evidence-quote broken' : 'evidence-quote'}>
                  {brokenEvidence ? `${evidenceLabel} đã bị sửa ngắn lại, hãy gắn lại bằng chứng` : `“${evidenceSnippet(evidenceText, question.evidence)}”`}
                </blockquote>
                <button type="button" className="link-button" onClick={() => onChange({ evidence: null })}>Bỏ</button>
              </div>
            ) : (
              <p className="evidence-empty">Chưa gắn bằng chứng.</p>
            )}
          </div>

          <label className="editor-field">
            Giải thích <small>(mỗi dòng một bước, hiện ở trang Xem lại)</small>
            <textarea rows={3} value={question.explanation.join('\n')} onChange={(event) => onChange({ explanation: event.target.value.split('\n') })} />
          </label>

          <div className="question-body-footer">
            <button type="button" className="link-button danger" onClick={onRemove}>Xoá câu {number}</button>
          </div>
        </div>
      )}
    </div>
  )
}
