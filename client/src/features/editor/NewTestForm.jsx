import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createTest } from '../../api/testEditor.js'
import { getErrorMessage } from '../../api/errorMessages.js'

// Step 1 of creating a test: name, skill and kind (US11). Then the editor opens.
export default function NewTestForm() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [skill, setSkill] = useState('reading')
  const [kind, setKind] = useState('full')
  const [error, setError] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const sectionWord = skill === 'reading' ? 'passage' : 'part'
  const fullSize = skill === 'reading' ? 3 : 4

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsCreating(true)
    try {
      const test = await createTest({ title, skill, kind })
      navigate(`/tests/${test.id}/edit`, { replace: true })
    } catch (createError) {
      setError(getErrorMessage(createError))
      setIsCreating(false)
    }
  }

  return (
    <main className="page">
      <form className="new-test-form" onSubmit={handleSubmit}>
        <h1>Tạo đề mới</h1>

        <label className="editor-field">
          Tên đề
          <input type="text" required maxLength={120} placeholder="Ví dụ: Cambridge 18 – Test 1" value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>

        <fieldset className="editor-field choice-row">
          <legend>Kỹ năng</legend>
          <label><input type="radio" checked={skill === 'reading'} onChange={() => setSkill('reading')} /> Reading</label>
          <label><input type="radio" checked={skill === 'listening'} onChange={() => setSkill('listening')} /> Listening</label>
        </fieldset>

        <fieldset className="editor-field choice-row">
          <legend>Loại đề</legend>
          <label><input type="radio" checked={kind === 'full'} onChange={() => setKind('full')} /> Full test ({fullSize} {sectionWord})</label>
          <label><input type="radio" checked={kind === 'single'} onChange={() => setKind('single')} /> Đề lẻ (1 {sectionWord})</label>
        </fieldset>

        {error && <p className="editor-error" role="alert">{error}</p>}

        <button type="submit" className="editor-button primary" disabled={isCreating}>
          {isCreating ? 'Đang tạo…' : 'Tạo và soạn đề'}
        </button>
      </form>
    </main>
  )
}
