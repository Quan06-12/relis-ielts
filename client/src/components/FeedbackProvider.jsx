import { createContext, useCallback, useContext, useRef, useState } from 'react'
import './FeedbackProvider.css'

// Two kinds of feedback for the whole app:
// - toasts: short messages in a corner after an action ("Đã giao bài"), gone after 3 seconds
// - confirm: our own "are you sure?" dialog instead of the browser's grey window.confirm
//
// const toast = useToast();     toast('Đã lưu')   or   toast('Lỗi…', 'error')
// const confirm = useConfirm(); if (await confirm({ title, message, confirmLabel, danger: true })) { … }

const FeedbackContext = createContext(null)
const TOAST_MS = 3000

export function FeedbackProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const [question, setQuestion] = useState(null) // { title, message, confirmLabel, danger, resolve }
  const nextId = useRef(1)

  const toast = useCallback((text, kind = 'success') => {
    const id = nextId.current++
    setToasts((current) => [...current, { id, text, kind }])
    setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), TOAST_MS)
  }, [])

  // Returns a promise that resolves to true (confirmed) or false (cancelled)
  const confirm = useCallback(
    (options) => new Promise((resolve) => setQuestion({ confirmLabel: 'Đồng ý', danger: false, ...options, resolve })),
    []
  )

  function answer(isConfirmed) {
    question.resolve(isConfirmed)
    setQuestion(null)
  }

  return (
    <FeedbackContext.Provider value={{ toast, confirm }}>
      {children}

      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((item) => (
          <div key={item.id} className={`toast ${item.kind}`}>
            <span aria-hidden="true">{item.kind === 'error' ? '⚠️' : '✓'}</span> {item.text}
          </div>
        ))}
      </div>

      {question && (
        <div className="dialog-backdrop" onClick={() => answer(false)}>
          <div className="dialog confirm-dialog" role="alertdialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <h2>{question.title}</h2>
            {question.message && <p>{question.message}</p>}
            <div className="dialog-actions">
              <button type="button" className="secondary-button" onClick={() => answer(false)} autoFocus>Huỷ</button>
              <button type="button" className={question.danger ? 'primary-button danger' : 'primary-button'} onClick={() => answer(true)}>
                {question.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </FeedbackContext.Provider>
  )
}

export function useToast() {
  return useContext(FeedbackContext).toast
}

export function useConfirm() {
  return useContext(FeedbackContext).confirm
}
