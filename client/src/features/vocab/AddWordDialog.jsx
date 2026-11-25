import { useEffect, useState } from 'react'
import { listMySets, createSet, addWord } from '../../api/vocab.js'
import { getErrorMessage } from '../../api/errorMessages.js'
import { useToast } from '../../components/FeedbackProvider.jsx'
import { WORD_TYPES } from './vocabDisplay.js'

const NEW_SET = 'new'

// "Thêm vào từ vựng" while taking a test: the selected words and the sentence they come from are
// filled in; the student adds the meaning and picks a set (or makes a new one named after the test).
export default function AddWordDialog({ term, example, newSetName, onClose }) {
  const toast = useToast()
  const [sets, setSets] = useState(null)
  const [setId, setSetId] = useState(NEW_SET)
  const [setName, setSetName] = useState(newSetName)
  const [word, setWord] = useState({ term, type: 'other', meaning: '', example })
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    listMySets()
      .then((items) => {
        setSets(items)
        // Reuse the set made for this test earlier, otherwise the most recent one
        const sameName = items.find((item) => item.name === newSetName)
        if (sameName) setSetId(sameName.id)
        else if (items.length > 0) setSetId(items[0].id)
      })
      .catch(() => setSets([]))
  }, [newSetName])

  const change = (field) => (event) => setWord((current) => ({ ...current, [field]: event.target.value }))

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSaving(true)
    try {
      const targetId = setId === NEW_SET ? (await createSet({ name: setName.trim() || newSetName, color: 'blue' })).id : setId
      await addWord(targetId, word)
      toast(`Đã thêm "${word.term}" vào từ vựng`)
      onClose()
    } catch (saveError) {
      setError(getErrorMessage(saveError))
      setIsSaving(false)
    }
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <form className="dialog class-form add-word-dialog" role="dialog" aria-modal="true" aria-label="Thêm vào từ vựng" onClick={(event) => event.stopPropagation()} onSubmit={handleSubmit}>
        <h2>Thêm vào từ vựng</h2>
        <div className="add-word-row">
          <label>
            Từ
            <input type="text" required maxLength={80} value={word.term} onChange={change('term')} />
          </label>
          <label>
            Loại từ
            <select value={word.type} onChange={change('type')}>
              {WORD_TYPES.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Nghĩa
          <input type="text" required maxLength={200} autoFocus placeholder="Ví dụ: giảm nhẹ, làm dịu bớt" value={word.meaning} onChange={change('meaning')} />
        </label>
        <label>
          Câu ví dụ (lấy từ bài đọc)
          <textarea rows={3} maxLength={500} value={word.example} onChange={change('example')} />
        </label>
        <label>
          Lưu vào bộ từ
          <select value={setId} onChange={(event) => setSetId(event.target.value)} disabled={sets === null}>
            {(sets ?? []).map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
            <option value={NEW_SET}>+ Bộ mới…</option>
          </select>
        </label>
        {setId === NEW_SET && (
          <label>
            Tên bộ mới
            <input type="text" required maxLength={80} value={setName} onChange={(event) => setSetName(event.target.value)} />
          </label>
        )}
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="dialog-actions">
          <button type="button" className="secondary-button" onClick={onClose}>Huỷ</button>
          <button type="submit" className="primary-button" disabled={isSaving}>{isSaving ? 'Đang lưu…' : 'Lưu từ'}</button>
        </div>
      </form>
    </div>
  )
}
