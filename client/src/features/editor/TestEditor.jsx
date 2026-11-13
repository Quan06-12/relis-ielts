import { useEffect, useState } from 'react'
import { getTest, saveTest, changeTestStatus } from '../../api/testEditor.js'
import { getErrorMessage } from '../../api/errorMessages.js'
import * as edit from './editorState.js'
import FileUploadButton from './FileUploadButton.jsx'
import SectionEditor from './SectionEditor.jsx'

// The test editor: header (name, cover, time, save, publish), one tab per passage/part,
// and the content of the selected one. Everything is saved together with one PUT.
export default function TestEditor({ testId }) {
  const [test, setTest] = useState(null)
  const [currentSection, setCurrentSection] = useState(0)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState(null) // { type: 'error' | 'info', text }

  useEffect(() => {
    getTest(testId)
      .then(setTest)
      .catch((loadError) => setMessage({ type: 'error', text: getErrorMessage(loadError) }))
  }, [testId])

  // Ask before leaving the page with unsaved work
  useEffect(() => {
    if (!hasUnsavedChanges) return undefined
    const warn = (event) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [hasUnsavedChanges])

  if (!test) {
    return <p className="page">{message ? message.text : 'Đang tải đề…'}</p>
  }

  // Every change goes through here: apply a pure update from editorState.js and mark unsaved
  function change(update) {
    setTest((current) => update(current))
    setHasUnsavedChanges(true)
    setMessage(null)
  }

  // Actions for the selected section, so SectionEditor does not need to know its own index
  const sectionIndex = currentSection
  const sectionActions = {
    changeSection: (changes) => change((current) => edit.updateSection(current, sectionIndex, changes)),
    addGroup: (type) => change((current) => edit.addGroup(current, sectionIndex, type)),
    changeGroup: (groupIndex, changes) => change((current) => edit.updateGroup(current, sectionIndex, groupIndex, changes)),
    removeGroup: (groupIndex) => change((current) => edit.removeGroup(current, sectionIndex, groupIndex)),
    addQuestion: (groupIndex) => change((current) => edit.addQuestion(current, sectionIndex, groupIndex)),
    changeQuestion: (groupIndex, questionIndex, changes) =>
      change((current) => edit.updateQuestion(current, sectionIndex, groupIndex, questionIndex, changes)),
    removeQuestion: (groupIndex, questionIndex) =>
      change((current) => edit.removeQuestion(current, sectionIndex, groupIndex, questionIndex)),
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      const { test: savedTest, warning } = await saveTest(test)
      setTest(savedTest)
      setHasUnsavedChanges(false)
      setMessage(
        warning === 'ANSWERS_CHANGED_AFTER_ATTEMPTS'
          ? { type: 'info', text: 'Đã lưu. Lưu ý: đề đã có người làm, điểm cũ vẫn giữ theo đáp án cũ.' }
          : { type: 'info', text: 'Đã lưu.' }
      )
      return true
    } catch (saveError) {
      setMessage({ type: 'error', text: getErrorMessage(saveError) })
      return false
    } finally {
      setIsSaving(false)
    }
  }

  // US19: publish (save first) or move back to draft
  async function handleToggleStatus() {
    if (test.status === 'draft') {
      const missing = edit.questionsWithoutAnswer(test)
      if (missing.length > 0) {
        setMessage({ type: 'error', text: `Chưa xuất bản được: câu ${missing.join(', ')} chưa có đáp án.` })
        return
      }
      if (hasUnsavedChanges && !(await handleSave())) return
    }
    try {
      const summary = await changeTestStatus(test.id, test.status === 'draft' ? 'published' : 'draft')
      setTest((current) => ({ ...current, status: summary.status }))
      setMessage({ type: 'info', text: summary.status === 'published' ? 'Đã xuất bản.' : 'Đã chuyển về nháp.' })
    } catch (statusError) {
      setMessage({ type: 'error', text: getErrorMessage(statusError) })
    }
  }

  const numbers = edit.questionNumbers(test)
  const questionCount = Object.keys(numbers).length
  const sectionWord = test.skill === 'reading' ? 'Passage' : 'Part'

  return (
    <div className="test-editor">
      <header className="editor-header">
        <div className="editor-cover" style={test.coverUrl ? { backgroundImage: `url('${test.coverUrl}')` } : undefined}>
          <FileUploadButton
            kind="image"
            accept="image/jpeg,image/png,image/webp"
            label={test.coverUrl ? 'Đổi ảnh bìa' : 'Ảnh bìa'}
            onUploaded={({ url }) => change((current) => edit.updateTest(current, { coverUrl: url }))}
          />
        </div>

        <div className="editor-header-fields">
          <input
            className="editor-title"
            type="text"
            value={test.title}
            maxLength={120}
            onChange={(event) => change((current) => edit.updateTest(current, { title: event.target.value }))}
            aria-label="Tên đề"
          />
          <p className="editor-meta">
            {test.skill === 'reading' ? 'Reading' : 'Listening'} · {test.kind === 'full' ? 'Full test' : 'Đề lẻ'} · {questionCount} câu ·{' '}
            <span className={test.status === 'published' ? 'status-chip published' : 'status-chip'}>
              {test.status === 'published' ? 'Đã xuất bản' : 'Nháp'}
            </span>
          </p>
          <label className="editor-inline-field">
            Thời gian mặc định
            <input
              type="number"
              min={1}
              max={180}
              value={test.durationMin}
              onChange={(event) => change((current) => edit.updateTest(current, { durationMin: Number(event.target.value) }))}
            />
            phút
          </label>
        </div>

        <div className="editor-header-actions">
          <button type="button" className="editor-button" onClick={handleToggleStatus}>
            {test.status === 'draft' ? 'Xuất bản' : 'Chuyển về nháp'}
          </button>
          <button type="button" className="editor-button primary" onClick={handleSave} disabled={isSaving || !hasUnsavedChanges}>
            {isSaving ? 'Đang lưu…' : hasUnsavedChanges ? 'Lưu' : 'Đã lưu'}
          </button>
        </div>
      </header>

      {message && (
        <p className={message.type === 'error' ? 'editor-message error' : 'editor-message'} role={message.type === 'error' ? 'alert' : 'status'}>
          {message.text}
        </p>
      )}

      <nav className="editor-tabs">
        {test.sections.map((section, index) => (
          <button
            key={index}
            type="button"
            className={index === currentSection ? 'editor-tab active' : 'editor-tab'}
            onClick={() => setCurrentSection(index)}
          >
            {section.title || `${sectionWord} ${index + 1}`}
          </button>
        ))}
      </nav>

      <SectionEditor skill={test.skill} section={test.sections[currentSection]} numbers={numbers} actions={sectionActions} />
    </div>
  )
}
