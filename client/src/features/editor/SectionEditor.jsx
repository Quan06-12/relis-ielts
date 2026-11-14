import { useState } from 'react'
import { QUESTION_TYPES } from './editorState.js'
import GroupEditor from './GroupEditor.jsx'

// Right half of the editor: the question groups of the selected passage or part (US13–US15).
export default function SectionEditor({ skill, section, numbers, openKey, onToggleQuestion, actions }) {
  const [newGroupType, setNewGroupType] = useState('tfng')
  const evidenceText = skill === 'reading' ? section.passage : section.transcript
  const evidenceLabel = skill === 'reading' ? 'passage' : 'transcript'

  return (
    <div className="section-editor">
      {section.groups.length === 0 && (
        <p className="passage-empty">Phần này chưa có câu hỏi. Chọn dạng câu hỏi bên dưới rồi bấm &quot;+ Thêm nhóm câu hỏi&quot;.</p>
      )}

      {section.groups.map((group, groupIndex) => (
        <GroupEditor
          key={group.id ?? group.key}
          group={group}
          groupNumber={groupIndex + 1}
          numbers={numbers}
          openKey={openKey}
          onToggleQuestion={onToggleQuestion}
          evidenceText={evidenceText}
          evidenceLabel={evidenceLabel}
          actions={{
            changeGroup: (changes) => actions.changeGroup(groupIndex, changes),
            removeGroup: () => actions.removeGroup(groupIndex),
            addQuestion: () => actions.addQuestion(groupIndex),
            changeQuestion: (questionIndex, changes) => actions.changeQuestion(groupIndex, questionIndex, changes),
            removeQuestion: (questionIndex) => actions.removeQuestion(groupIndex, questionIndex),
          }}
        />
      ))}

      <div className="add-group-row">
        <select value={newGroupType} onChange={(event) => setNewGroupType(event.target.value)} aria-label="Dạng câu hỏi">
          {QUESTION_TYPES.map((type) => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
        <button type="button" className="editor-button primary" onClick={() => actions.addGroup(newGroupType)}>
          + Thêm nhóm câu hỏi
        </button>
      </div>
    </div>
  )
}
