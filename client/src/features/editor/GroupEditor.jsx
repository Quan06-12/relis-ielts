import { QUESTION_TYPES } from './editorState.js'
import QuestionEditor from './QuestionEditor.jsx'

// A group of questions sharing one type and instruction, e.g. "Questions 1–5" (US15).
export default function GroupEditor({ group, groupNumber, numbers, openKey, onToggleQuestion, evidenceText, evidenceLabel, actions }) {
  const typeLabel = QUESTION_TYPES.find((item) => item.value === group.type)?.label
  const keyOf = (question) => question.id ?? question.key
  const first = numbers[keyOf(group.questions[0] ?? {})]
  const last = numbers[keyOf(group.questions.at(-1) ?? {})]

  return (
    <section className="group-editor">
      <div className="group-editor-header">
        <h3>
          Nhóm {groupNumber} · {group.questions.length > 0 ? `Câu ${first}–${last}` : 'chưa có câu'}
        </h3>
        <span className="group-type">{typeLabel}</span>
      </div>

      <label className="editor-field">
        Hướng dẫn chung của nhóm
        <textarea
          rows={2}
          value={group.instruction}
          placeholder="Ví dụ: Do the following statements agree with the information given in the passage?"
          onChange={(event) => actions.changeGroup({ instruction: event.target.value })}
        />
      </label>

      <div className="question-list">
        {group.questions.map((question, questionIndex) => (
          <QuestionEditor
            key={keyOf(question)}
            type={group.type}
            question={question}
            number={numbers[keyOf(question)]}
            isOpen={openKey === keyOf(question)}
            onToggle={() => onToggleQuestion(keyOf(question))}
            evidenceText={evidenceText}
            evidenceLabel={evidenceLabel}
            onChange={(changes) => actions.changeQuestion(questionIndex, changes)}
            onRemove={() => actions.removeQuestion(questionIndex)}
          />
        ))}
      </div>

      <div className="group-editor-footer">
        <button type="button" className="editor-button" onClick={actions.addQuestion}>+ Thêm câu hỏi</button>
        <button type="button" className="link-button danger" onClick={actions.removeGroup}>Xoá nhóm</button>
      </div>
    </section>
  )
}
