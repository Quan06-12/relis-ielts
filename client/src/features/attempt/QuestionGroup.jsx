import { splitGap, groupHeading, isGapGroup } from './questionText.js'

// One group of questions as in the computer-delivered IELTS: "Questions 1–7", the instruction,
// then either a box of notes with a gap in each line (completion, short answer)
// or each question with its options as full-width rows.
export default function QuestionGroup({ group, answers, onAnswer, onFocusQuestion }) {
  return (
    <section className="question-group">
      <h3 className="question-heading">{groupHeading(group.questions)}</h3>
      <p className="question-instruction">{group.instruction}</p>

      {isGapGroup(group.type) ? (
        <div className="notes-box">
          <ul>
            {group.questions.map((question) => (
              <GapLine
                key={question.id}
                question={question}
                value={answers[question.id]?.[0] ?? ''}
                onChange={(text) => onAnswer(question.id, [text])}
                onFocus={() => onFocusQuestion(question)}
              />
            ))}
          </ul>
        </div>
      ) : (
        group.questions.map((question) => (
          <div key={question.id} id={`question-${question.number}`} className="question">
            <p className="question-prompt">
              <span className="question-number">{question.number}</span> {question.prompt}
            </p>
            <OptionRows
              type={group.type}
              question={question}
              value={answers[question.id] ?? []}
              onChange={(value) => onAnswer(question.id, value)}
              onFocus={() => onFocusQuestion(question)}
            />
          </div>
        ))
      )}
    </section>
  )
}

// "In the Bíró design, a revolving ball was supplied with ink by a [ 1 ]"
function GapLine({ question, value, onChange, onFocus }) {
  const { before, after } = splitGap(question.prompt)
  return (
    <li id={`question-${question.number}`}>
      {before}
      <input
        type="text"
        className="gap-input"
        value={value}
        placeholder={String(question.number)}
        aria-label={`Câu ${question.number}`}
        autoComplete="off"
        spellCheck={false}
        onChange={(event) => onChange(event.target.value)}
        onFocus={onFocus}
      />
      {after}
    </li>
  )
}

// Each option is a row that can be clicked anywhere; the chosen row is shaded
function OptionRows({ type, question, value, onChange, onFocus }) {
  // Choose several answers, e.g. "Choose TWO letters"
  if (type === 'multi_select') {
    const toggle = (option) => onChange(value.includes(option) ? value.filter((item) => item !== option) : [...value, option])
    return (
      <div className="option-rows">
        {question.options.map((option) => (
          <label key={option} className={value.includes(option) ? 'option-row chosen' : 'option-row'}>
            <input type="checkbox" checked={value.includes(option)} onChange={() => toggle(option)} onFocus={onFocus} />
            {option}
          </label>
        ))}
      </div>
    )
  }

  // Choose one: multiple choice, TRUE/FALSE/NOT GIVEN, YES/NO/NOT GIVEN, matching
  return (
    <div className="option-rows">
      {question.options.map((option) => (
        <label key={option} className={value[0] === option ? 'option-row chosen' : 'option-row'}>
          <input type="radio" name={question.id} checked={value[0] === option} onChange={() => onChange([option])} onFocus={onFocus} />
          {option}
        </label>
      ))}
    </div>
  )
}
