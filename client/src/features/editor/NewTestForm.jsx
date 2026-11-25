import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { createTest } from '../../api/testEditor.js'
import { getErrorMessage } from '../../api/errorMessages.js'
import { useAuth } from '../../auth/AuthContext.jsx'

// Icons drawn as one SVG path each (24×24, stroke)
const ICONS = {
  reading: 'M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2zM4 21V5M8 7h6M8 11h6',
  listening: 'M3 18v-6a9 9 0 0 1 18 0v6M3 18a2 2 0 0 0 2 2h1v-6H5a2 2 0 0 0-2 2zm18 0a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2z',
  full: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  single: 'M6 3h9l4 4v14H6zM15 3v4h4M9 12h7M9 16h5',
  shield: 'M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6zM9 12l2 2 4-4',
}

// Step 1 of creating a test: name, skill and kind (US11). Then the editor opens.
export default function NewTestForm() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  // "+ Tạo đề" → "Đề Listening" opens this form with ?skill=listening
  const [searchParams] = useSearchParams()
  const [skill, setSkill] = useState(searchParams.get('skill') === 'listening' ? 'listening' : 'reading')
  const [kind, setKind] = useState('full')
  const { user } = useAuth()
  // Admins: "Kho đề Relis" (system test, everyone can take it once published) or their own library
  const [place, setPlace] = useState(searchParams.get('system') === '1' ? 'system' : 'mine')
  const [error, setError] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const sectionWord = skill === 'reading' ? 'passage' : 'part'
  const fullSize = skill === 'reading' ? 3 : 4

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsCreating(true)
    try {
      const test = await createTest({ title, skill, kind, system: user?.isAdmin === true && place === 'system' })
      navigate(`/tests/${test.id}/edit`, { replace: true })
    } catch (createError) {
      setError(getErrorMessage(createError))
      setIsCreating(false)
    }
  }

  return (
    <main className="page">
      <form className="new-test-form" onSubmit={handleSubmit}>
        <h1>{user?.isAdmin && place === 'system' ? 'Tạo đề cho Kho đề Relis' : 'Tạo đề mới'}</h1>

        <label className="editor-field">
          Tên đề
          <input type="text" required maxLength={120} placeholder="Ví dụ: Cambridge 18 – Test 1" value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>

        <ChoiceTiles
          legend="Kỹ năng"
          value={skill}
          onChange={setSkill}
          options={[
            { value: 'reading', title: 'Reading', text: 'Đoạn văn bên trái, câu hỏi bên phải', icon: ICONS.reading, tone: 'reading' },
            { value: 'listening', title: 'Listening', text: 'File audio kèm câu hỏi theo từng part', icon: ICONS.listening, tone: 'listening' },
          ]}
        />

        <ChoiceTiles
          legend="Loại đề"
          value={kind}
          onChange={setKind}
          options={[
            { value: 'full', title: 'Full test', text: `${fullSize} ${sectionWord}, tính band khi làm đủ`, icon: ICONS.full },
            { value: 'single', title: 'Bài lẻ', text: `1 ${sectionWord}, luyện nhanh một phần`, icon: ICONS.single },
          ]}
        />

        {user?.isAdmin && (
          <ChoiceTiles
            legend="Lưu vào"
            value={place}
            onChange={setPlace}
            options={[
              { value: 'mine', title: 'Đề của tôi', text: 'Chỉ bạn và lớp bạn chia sẻ thấy', icon: ICONS.single },
              { value: 'system', title: 'Kho đề Relis', text: 'Mọi người làm được khi xuất bản', icon: ICONS.shield, tone: 'system' },
            ]}
          />
        )}

        {error && <p className="editor-error" role="alert">{error}</p>}

        <button type="submit" className="editor-button primary" disabled={isCreating}>
          {isCreating ? 'Đang tạo…' : 'Tạo và soạn đề'}
        </button>
      </form>
    </main>
  )
}

// A group of large selectable cards. Each card is a real radio button (hidden), so the keyboard
// and screen readers work as with ordinary radios.
function ChoiceTiles({ legend, value, onChange, options }) {
  return (
    <fieldset className="choice-tiles">
      <legend>{legend}</legend>
      <div className="choice-tiles-grid">
        {options.map((option) => (
          <label key={option.value} className={`choice-tile ${option.tone ?? ''} ${value === option.value ? 'selected' : ''}`}>
            <input type="radio" name={legend} checked={value === option.value} onChange={() => onChange(option.value)} />
            <span className="choice-tile-icon" aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={option.icon} />
              </svg>
            </span>
            <span className="choice-tile-text">
              <strong>{option.title}</strong>
              <span>{option.text}</span>
            </span>
            <span className="choice-tile-check" aria-hidden="true">✓</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
