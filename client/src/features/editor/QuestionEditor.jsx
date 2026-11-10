import { isTextType, hasFixedOptions } from './editorState.js'

// One question: prompt, options, correct answer(s) and explanation steps (US16, US17).
export default function QuestionEditor({ type, question, number, onChange, onRemove }) {
  const isMultiple = type === 'multi_select'

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
