import { useState } from 'react'
import { QUESTION_TYPES } from './editorState.js'
import FileUploadButton from './FileUploadButton.jsx'
import GroupEditor from './GroupEditor.jsx'

// One Reading passage or Listening part with its question groups (US13, US14, US15).
export default function SectionEditor({ skill, section, numbers, actions }) {
  const [newGroupType, setNewGroupType] = useState('tfng')

  return (
    <div className="section-editor">
      <label className="editor-field">
        Tiêu đề
        <input type="text" value={section.title} onChange={(event) => actions.changeSection({ title: event.target.value })} />
      </label>

      {skill === 'reading' ? (
        <label className="editor-field">
          Nội dung passage <small>(xuống dòng để tách đoạn)</small>
          <textarea rows={14} value={section.passage} onChange={(event) => actions.changeSection({ passage: event.target.value })} />
        </label>
      ) : (
        <>
          <div className="editor-field">
            Audio
            <div className="audio-row">
              {section.audioUrl && <audio src={section.audioUrl} controls preload="metadata" />}
              <FileUploadButton
                kind="audio"
                accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/aac"
                label={section.audioUrl ? 'Đổi audio' : 'Tải audio lên (mp3, m4a, tối đa 30 MB)'}
                onUploaded={({ url, durationSec }) => actions.changeSection({ audioUrl: url, audioDurationSec: durationSec })}
              />
            </div>
          </div>
          <label className="editor-field">
            Transcript <small>(chỉ hiện ở trang Xem lại)</small>
            <textarea rows={10} value={section.transcript} onChange={(event) => actions.changeSection({ transcript: event.target.value })} />
          </label>
        </>
      )}

      {section.groups.map((group, groupIndex) => (
        <GroupEditor
          key={group.id ?? group.key}
          group={group}
          numbers={numbers}
          onChangeGroup={(changes) => actions.changeGroup(groupIndex, changes)}
          onRemoveGroup={() => actions.removeGroup(groupIndex)}
          onAddQuestion={() => actions.addQuestion(groupIndex)}
          onChangeQuestion={(questionIndex, changes) => actions.changeQuestion(groupIndex, questionIndex, changes)}
          onRemoveQuestion={(questionIndex) => actions.removeQuestion(groupIndex, questionIndex)}
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
