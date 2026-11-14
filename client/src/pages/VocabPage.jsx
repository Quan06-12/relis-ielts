import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { listMySets, createSet } from '../api/vocab.js'
import { getErrorMessage } from '../api/errorMessages.js'
import { CLASS_COLORS, colorOf } from '../features/classes/classDisplay.js'
import { wordCountLabel, previewLabel } from '../features/vocab/vocabDisplay.js'
import FileUploadButton from '../features/editor/FileUploadButton.jsx'
import { SkeletonCards } from '../components/Skeleton.jsx'
import { useToast } from '../components/FeedbackProvider.jsx'
import './VocabPage.css'

// Vocabulary page (US47, wireframe): my sets by topic as cards; click one to see and add words.
export default function VocabPage() {
  const navigate = useNavigate()
  const [sets, setSets] = useState(null)
  const [error, setError] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    listMySets()
      .then(setSets)
      .catch((loadError) => setError(getErrorMessage(loadError)))
  }, [])

  return (
    <main className="page">
      <div className="vocab-header">
        <div className="page-heading">
          <h1>Kho từ vựng</h1>
          <p className="page-subtitle">Gom từ theo chủ đề. Bấm vào một bộ để xem và thêm từ.</p>
        </div>
        <button type="button" className="primary-button" onClick={() => setIsCreating(true)}>+ Tạo bộ từ</button>
      </div>

      {error && <p className="library-message error">{error}</p>}
      {!sets && !error && <SkeletonCards />}

      {sets && (
        <div className="vocab-grid">
          {sets.map((set) => (
            <Link key={set.id} to={`/vocab/${set.id}`} className="vocab-card" style={{ '--set-color': colorOf(set.color) }}>
              <div className="vocab-cover" style={set.coverUrl ? { backgroundImage: `url('${set.coverUrl}')` } : undefined} />
              <div className="vocab-card-body">
                <h3>{set.name}</h3>
                <p>{previewLabel(set.preview)}</p>
                <span className="vocab-count">{wordCountLabel(set.wordCount)}</span>
              </div>
            </Link>
          ))}
          <button type="button" className="vocab-add-card" onClick={() => setIsCreating(true)}>+ Thêm bộ từ</button>
        </div>
      )}

      {isCreating && <CreateSetDialog onClose={() => setIsCreating(false)} onCreated={(set) => navigate(`/vocab/${set.id}`)} />}
    </main>
  )
}

// US47: only the name is required; colour and cover are optional
function CreateSetDialog({ onClose, onCreated }) {
  const toast = useToast()
  const [name, setName] = useState('')
  const [color, setColor] = useState('purple')
  const [coverUrl, setCoverUrl] = useState(null)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    try {
      const set = await createSet({ name, color, coverUrl })
      toast(`Đã tạo bộ ${set.name}`)
      onCreated(set)
    } catch (createError) {
      setError(getErrorMessage(createError))
    }
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <form className="dialog class-form" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()} onSubmit={handleSubmit}>
        <h2>Tạo bộ từ</h2>
        <label>
          Tên chủ đề
          <input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} placeholder="Ví dụ: Environment" required autoFocus />
        </label>
        <fieldset className="class-colors">
          <legend>Màu (dùng khi không có ảnh bìa)</legend>
          {Object.entries(CLASS_COLORS).map(([colorName, hex]) => (
            <button
              key={colorName}
              type="button"
              className={color === colorName ? 'color-swatch selected' : 'color-swatch'}
              style={{ background: hex }}
              onClick={() => setColor(colorName)}
              aria-label={colorName}
              aria-pressed={color === colorName}
            />
          ))}
        </fieldset>
        <div className="vocab-cover-field">
          <span>Ảnh bìa (không bắt buộc)</span>
          {coverUrl && <img src={coverUrl} alt="" />}
          <FileUploadButton kind="image" accept="image/jpeg,image/png,image/webp" className="secondary-button" label={coverUrl ? 'Đổi ảnh' : 'Tải ảnh lên'} onUploaded={({ url }) => setCoverUrl(url)} />
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="dialog-actions">
          <button type="button" className="secondary-button" onClick={onClose}>Huỷ</button>
          <button type="submit" className="primary-button" disabled={name.trim() === ''}>Tạo bộ</button>
        </div>
      </form>
    </div>
  )
}
