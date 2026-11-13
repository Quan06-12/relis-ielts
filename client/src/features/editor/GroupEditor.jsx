import { QUESTION_TYPES } from './editorState.js'
import QuestionEditor from './QuestionEditor.jsx'

// A group of questions sharing one type and instruction, e.g. "Questions 1–5" (US15).
export default function GroupEditor({ group, numbers, onChangeGroup, onRemoveGroup, onAddQuestion, onChangeQuestion, onRemoveQuestion }) {
  const typeLabel = QUESTION_TYPES.find((item) => item.value === group.type)?.label
  const first = numbers[group.questions[0]?.id ?? group.questions[0]?.key]
  const last = numbers[group.questions.at(-1)?.id ?? group.questions.at(-1)?.key]

  return (
    <section className="group-editor">
      <div className="group-editor-header">
        <h3>
          {group.questions.length > 0 ? `Câu ${first}–${last}` : 'Nhóm trống'} · {typeLabel}
        </h3>
        <button type="button" className="link-button danger" onClick={onRemoveGroup}>Xoá nhóm</button>
      </div>

      <label className="editor-field">
        Hướng dẫn cho nhóm <small>(ví dụ "Do the following statements agree with the information in the passage?")</small>
        <textarea rows={2} value={group.instruction} onChange={(event) => onChangeGroup({ instruction: event.target.value })} />
      </label>

      {group.questions.map((question, questionIndex) => (
        <QuestionEditor
          key={question.id ?? question.key}
          type={group.type}
          question={question}
          number={numbers[question.id ?? question.key]}
          onChange={(changes) => onChangeQuestion(questionIndex, changes)}
          onRemove={() => onRemoveQuestion(questionIndex)}
        />
      ))}

      <button type="button" className="editor-button" onClick={onAddQuestion}>+ Thêm câu hỏi</button>
    </section>
  )
}
