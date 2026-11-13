// One group of questions with its instruction, e.g. "Questions 1–5: TRUE / FALSE / NOT GIVEN".
// The input depends on the question type.
export default function QuestionGroup({ group, answers, onAnswer }) {
  return (
    <section className="question-group">
      <p className="question-instruction">{group.instruction}</p>

      {group.questions.map((question) => (
        <div key={question.id} id={`question-${question.number}`} className="question">
          <p className="question-prompt">
            <span className="question-number">{question.number}</span> {question.prompt}
          </p>
          <AnswerInput type={group.type} question={question} value={answers[question.id] ?? []} onChange={(value) => onAnswer(question.id, value)} />
        </div>
      ))}
    </section>
  )
}

function AnswerInput({ type, question, value, onChange }) {
  // Write the answer: sentence / summary completion, short answer
  if (type === 'completion' || type === 'short_answer') {
    return (
      <input
        type="text"
        className="answer-text"
        value={value[0] ?? ''}
        onChange={(event) => onChange([event.target.value])}
        aria-label={`Câu ${question.number}`}
      />
    )
  }

  // Choose several answers, e.g. "Choose TWO letters"
  if (type === 'multi_select') {
    function toggle(option) {
      onChange(value.includes(option) ? value.filter((item) => item !== option) : [...value, option])
    }
    return (
      <div className="answer-options">
        {question.options.map((option) => (
          <label key={option}>
            <input type="checkbox" checked={value.includes(option)} onChange={() => toggle(option)} /> {option}
          </label>
        ))}
      </div>
    )
  }

  // Choose one: multiple choice, TRUE/FALSE/NOT GIVEN, YES/NO/NOT GIVEN, matching
  return (
    <div className="answer-options">
      {question.options.map((option) => (
        <label key={option}>
          <input type="radio" name={question.id} checked={value[0] === option} onChange={() => onChange([option])} /> {option}
        </label>
      ))}
    </div>
  )
}
