import { useRef, useState } from 'react'
import { uploadFile } from '../../api/uploads.js'
import { getErrorMessage } from '../../api/errorMessages.js'

// A button that picks a file, uploads it and reports the result to `onUploaded({ url, durationSec })`.
export default function FileUploadButton({ kind, accept, label, onUploaded }) {
  const inputRef = useRef(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFileChosen(event) {
    const file = event.target.files[0]
    event.target.value = '' // allow choosing the same file again
    if (!file) return

    setError('')
    setIsUploading(true)
    try {
      onUploaded(await uploadFile(file, kind))
    } catch (uploadError) {
      setError(getErrorMessage(uploadError))
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <span className="file-upload">
      <input ref={inputRef} type="file" accept={accept} hidden onChange={handleFileChosen} />
      <button type="button" className="editor-button" onClick={() => inputRef.current.click()} disabled={isUploading}>
        {isUploading ? 'Đang tải lên…' : label}
      </button>
      {error && <span className="editor-error">{error}</span>}
    </span>
  )
}
