import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getTest, saveTest, changeTestStatus } from '../../api/testEditor.js'
import { getErrorMessage } from '../../api/errorMessages.js'
import * as edit from './editorState.js'
import FileUploadButton from './FileUploadButton.jsx'
import PassagePane from './PassagePane.jsx'
import SectionEditor from './SectionEditor.jsx'

// The test editor (wireframe): a top bar (name, status, save, publish), a settings row,
// then the passage on the left and its questions on the right. Everything is saved together with one PUT.
export default function TestEditor({ testId }) {
  const [test, setTest] = useState(null)
  const [currentSection, setCurrentSection] = useState(0)
  const [openKey, setOpenKey] = useState(null) // the question that is open on the right (id or temporary key)
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
    addGroup: (type) => change((current) => edit.addGroup(current, sectionIndex, type)),
    changeGroup: (groupIndex, changes) => change((current) => edit.updateGroup(current, sectionIndex, groupIndex, changes)),
    removeGroup: (groupIndex) => change((current) => edit.removeGroup(current, sectionIndex, groupIndex)),
    addQuestion: (groupIndex) => change((current) => edit.addQuestion(current, sectionIndex, groupIndex)),
    changeQuestion: (groupIndex, questionIndex, changes) =>
      change((current) => edit.updateQuestion(current, sectionIndex, groupIndex, questionIndex, changes)),
    removeQuestion: (groupIndex, questionIndex) =>
      change((current) => edit.removeQuestion(current, sectionIndex, groupIndex, questionIndex)),
  }

  // US18: the text selected on the left becomes the evidence of the open question
  function attachEvidence(evidence) {
    change((current) => {
      const place = edit.findQuestion(current, openKey)
      return place ? edit.updateQuestion(current, place.sectionIndex, place.groupIndex, place.questionIndex, { evidence }) : current
    })
  }

  function selectSection(index) {
    setCurrentSection(index)
    setOpenKey(null)
  }

  // The yellow "N câu cần bổ sung" button jumps to the first question without an answer
  function showFirstMissing() {
    const missing = edit.firstQuestionWithoutAnswer(test)
    if (!missing) return
    setCurrentSection(missing.sectionIndex)
    setOpenKey(missing.key)
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      const { test: savedTest, warning } = await saveTest(test)
      setTest(savedTest)
      setHasUnsavedChanges(false)
      // New questions now have a real id, so a temporary key no longer matches anything
      setOpenKey((current) => (current?.startsWith('new-') ? null : current))
      setMessage(
        warning === 'ANSWERS_CHANGED_AFTER_ATTEMPTS'
          ? { type: 'info', text: 'Đã lưu. Lưu ý: đề đã có người làm, điểm cũ vẫn giữ theo đáp án cũ.' }
          : { type: 'info', text: 'Đã lưu.' },
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
        showFirstMissing()
        return
      }
      if (hasUnsavedChanges && !(await handleSave())) return
    }
    try {
      const summary = await changeTestStatus(test.id, test.status === 'draft' ? 'published' : 'draft')
      setTest((current) => ({ ...current, status: summary.status }))
      setMessage({ type: 'info', text: summary.status === 'published' ? 'Đã xuất bản. Đề đã hiện trong Kho đề.' : 'Đã chuyển về nháp.' })
    } catch (statusError) {
      setMessage({ type: 'error', text: getErrorMessage(statusError) })
    }
  }

  const numbers = edit.questionNumbers(test)
  const missingCount = edit.questionsWithoutAnswer(test).length
  const openNumber = openKey ? numbers[openKey] : null
  const isReading = test.skill === 'reading'

  return (
    <div className="editor-shell">
      <header className="editor-topbar">
        <Link to="/library" className="editor-close" aria-label="Đóng, về Kho đề" title="Về Kho đề">✕</Link>
        <div className="editor-thumb" style={test.coverUrl ? { backgroundImage: `url('${test.coverUrl}')` } : undefined}>
          {!test.coverUrl && <span>Ảnh bìa</span>}
        </div>
        <div className="editor-name">
          <input
            className="editor-title"
            type="text"
            value={test.title}
            maxLength={120}
            onChange={(event) => change((current) => edit.updateTest(current, { title: event.target.value }))}
            aria-label="Tên đề"
          />
          <p className="editor-meta">
            <span className={test.status === 'published' ? 'status-chip published' : 'status-chip'}>
              {test.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}
            </span>
            {isSaving ? 'Đang lưu…' : hasUnsavedChanges ? 'Có thay đổi chưa lưu' : 'Đã lưu mọi thay đổi'} · Kho cá nhân
          </p>
        </div>

        <div className="editor-header-actions">
          {missingCount > 0 && (
            <button type="button" className="missing-pill" onClick={showFirstMissing} title="Mở câu đầu tiên chưa có đáp án">
              ⚠ {missingCount} câu cần bổ sung
            </button>
          )}
          <button type="button" className="editor-button" onClick={handleSave} disabled={isSaving || !hasUnsavedChanges}>
            {isSaving ? 'Đang lưu…' : 'Lưu'}
          </button>
          <button type="button" className="editor-button primary" onClick={handleToggleStatus}>
            {test.status === 'draft' ? 'Xuất bản' : 'Chuyển về nháp'}
          </button>
        </div>
      </header>

      <div className="editor-settings">
        <span className="setting">
          Kỹ năng <strong className="setting-chip">{isReading ? 'Reading' : 'Listening'}</strong>
        </span>
        <span className="setting">
          Loại đề{' '}
          <strong className="setting-chip">
            {test.kind === 'full' ? 'Full test' : 'Đề lẻ'} · {test.sections.length} {isReading ? 'passage' : 'part'}
          </strong>
        </span>
        <label className="setting">
          Thời gian
          <input
            type="number"
            min={1}
            max={180}
            value={test.durationMin}
            onChange={(event) => change((current) => edit.updateTest(current, { durationMin: Number(event.target.value) }))}
          />
          phút
        </label>
        <span className="setting">
          Ảnh bìa
          <FileUploadButton
            kind="image"
            accept="image/jpeg,image/png,image/webp"
            className="editor-button small"
            label={test.coverUrl ? 'Đổi ảnh' : 'Tải ảnh lên'}
            onUploaded={({ url }) => change((current) => edit.updateTest(current, { coverUrl: url }))}
          />
        </span>
        {message && (
          <p className={message.type === 'error' ? 'editor-message error' : 'editor-message'} role={message.type === 'error' ? 'alert' : 'status'}>
            {message.text}
          </p>
        )}
      </div>

      <div className="editor-body">
        <PassagePane
          test={test}
          sectionIndex={currentSection}
          onSelectSection={selectSection}
          numbers={numbers}
          activeQuestion={openKey && openNumber ? { key: openKey, number: openNumber } : null}
          onChangeSection={(changes) => change((current) => edit.updateSection(current, sectionIndex, changes))}
          onAttach={attachEvidence}
        />
        <div className="questions-pane">
          <SectionEditor
            skill={test.skill}
            section={test.sections[currentSection]}
            numbers={numbers}
            openKey={openKey}
            onToggleQuestion={(key) => setOpenKey((current) => (current === key ? null : key))}
            actions={sectionActions}
          />
        </div>
      </div>
    </div>
  )
}
