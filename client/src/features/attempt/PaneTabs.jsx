import SlideHighlight from '../../components/SlideHighlight.jsx'

// Phones only (hidden by CSS on wider screens): the passage and the questions get the whole
// screen one at a time, switched with these two tabs, instead of two cramped halves.
export default function PaneTabs({ pane, onChange, questionsLabel = 'Câu hỏi' }) {
  return (
    <div className="pane-tabs" role="tablist" aria-label="Bài đọc hoặc câu hỏi">
      <SlideHighlight activeKey={`${pane}-${questionsLabel}`} />
      {[
        { value: 'passage', label: 'Bài đọc' },
        { value: 'questions', label: questionsLabel },
      ].map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={pane === tab.value}
          className={pane === tab.value ? 'pane-tab active' : 'pane-tab'}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
