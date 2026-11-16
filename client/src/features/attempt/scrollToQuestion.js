// Brings an element into view inside its own scrolling column, without moving the whole page
// (scrollIntoView would also scroll the page and hide the header).
export function scrollWithinColumn(element, { offset = 24, center = false } = {}) {
  if (!element) return
  const column = findScrollingParent(element)
  if (!column) {
    element.scrollIntoView({ block: 'nearest' })
    return
  }
  const distance = element.getBoundingClientRect().top - column.getBoundingClientRect().top
  const shift = center ? (column.clientHeight - element.offsetHeight) / 2 : offset
  column.scrollTo({ top: column.scrollTop + distance - shift, behavior: 'smooth' })
}

// A question of the attempt or review page, by its number
export function scrollToQuestion(number) {
  scrollWithinColumn(document.getElementById(`question-${number}`))
}

// The nearest parent that scrolls on its own (the passage, the transcript or the question column)
function findScrollingParent(element) {
  for (let parent = element.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
    const { overflowY } = getComputedStyle(parent)
    if ((overflowY === 'auto' || overflowY === 'scroll') && parent.scrollHeight > parent.clientHeight) return parent
  }
  return null
}
