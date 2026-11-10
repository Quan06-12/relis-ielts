export default function QuestionInput({ group, question, value = [], onChange, disabled }) {
  const choices = question.options?.length
    ? question.options
    : group.type === 'tfng'
      ? ['TRUE', 'FALSE', 'NOT GIVEN']
      : group.type === 'ynng'
        ? ['YES', 'NO', 'NOT GIVEN']
        : []
  const label = `Câu ${question.number}`
  if (!choices.length)
    return (
      <label className="answer-field">
        Đáp án {label}
        <input
          aria-label={label}
          value={value[0] || ''}
          maxLength={2000}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value ? [e.target.value] : [])}
          autoComplete="off"
        />
      </label>
    )
  return (
    <fieldset disabled={disabled} className="options">
      <legend className="sr-only">{label}</legend>
      {choices.map((option) => (
        <label key={option}>
          <input
            type={group.type === 'multi_select' ? 'checkbox' : 'radio'}
            name={question.id}
            checked={value.includes(option)}
            onChange={(e) =>
              onChange(
                group.type === 'multi_select'
                  ? e.target.checked
                    ? [...value, option]
                    : value.filter((v) => v !== option)
                  : [option],
              )
            }
          />
          {option}
        </label>
      ))}
      <button type="button" className="text-button" onClick={() => onChange([])}>
        Xóa đáp án
      </button>
    </fieldset>
  )
}
