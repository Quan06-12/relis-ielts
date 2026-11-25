import { useCallback, useEffect, useState } from 'react'
import { shuffled, roundSummary } from './flashcards.js'
import { typeInfo } from './vocabDisplay.js'

// Flashcard review of a set: the word on the front, meaning and example on the back.
// Space or a click flips the card; "Chưa nhớ" / "Đã nhớ" (or ← / →) go to the next one.
// At the end the student can go again with only the words they did not remember.
export default function Flashcards({ words, setName, onClose }) {
  const [cards, setCards] = useState(() => shuffled(words))
  const [position, setPosition] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [results, setResults] = useState({})

  const isDone = position >= cards.length
  const card = cards[position]

  const answer = useCallback(
    (result) => {
      if (isDone) return
      setResults((current) => ({ ...current, [card.id]: result }))
      setIsFlipped(false)
      setPosition((current) => current + 1)
    },
    [card, isDone]
  )

  function restart(list) {
    setCards(shuffled(list))
    setPosition(0)
    setResults({})
    setIsFlipped(false)
  }

  useEffect(() => {
    function handleKey(event) {
      if (event.key === 'Escape') onClose()
      if (isDone) return
      if (event.key === ' ') {
        event.preventDefault()
        setIsFlipped((flipped) => !flipped)
      }
      if (event.key === 'ArrowLeft') answer('again')
      if (event.key === 'ArrowRight') answer('known')
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [answer, isDone, onClose])

  const summary = isDone ? roundSummary(cards, results) : null

  return (
    <div className="flashcards-backdrop" role="dialog" aria-modal="true" aria-label={`Ôn tập bộ ${setName}`}>
      <div className="flashcards">
        <div className="flashcards-top">
          <p>{setName}</p>
          <span>{isDone ? 'Xong' : `${position + 1} / ${cards.length}`}</span>
          <button type="button" className="flashcards-close" onClick={onClose} aria-label="Đóng">×</button>
        </div>
        <div className="flashcards-progress">
          <span style={{ width: `${(Math.min(position, cards.length) / cards.length) * 100}%` }} />
        </div>

        {!isDone ? (
          <>
            <button type="button" className={isFlipped ? 'flashcard flipped' : 'flashcard'} onClick={() => setIsFlipped((flipped) => !flipped)}>
              <span className="flashcard-face front">
                <small>{typeInfo(card.type).label}</small>
                <strong>{card.term}</strong>
                <em>Bấm hoặc nhấn Space để lật</em>
              </span>
              <span className="flashcard-face back">
                <strong>{card.meaning}</strong>
                {card.example && <q>{card.example}</q>}
                {card.note && <small>{card.note}</small>}
              </span>
            </button>
            <div className="flashcards-actions">
              <button type="button" className="again" onClick={() => answer('again')}>← Chưa nhớ</button>
              <button type="button" className="known" onClick={() => answer('known')}>Đã nhớ →</button>
            </div>
          </>
        ) : (
          <div className="flashcards-done">
            <p className="flashcards-score">
              <strong>{summary.known}</strong>/{summary.total} từ đã nhớ
            </p>
            <p>{summary.again.length === 0 ? 'Bạn đã nhớ hết bộ này. Tuyệt vời!' : `Còn ${summary.again.length} từ cần ôn thêm.`}</p>
            <div className="flashcards-actions">
              {summary.again.length > 0 && (
                <button type="button" className="known" onClick={() => restart(summary.again)}>Ôn lại {summary.again.length} từ chưa nhớ</button>
              )}
              <button type="button" className="again" onClick={() => restart(words)}>Ôn lại cả bộ</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
