// Small pure helpers for the vocabulary pages (US47, US48), unit tested.

// Word types: short tag in the table, full name in the detail panel and the form
export const WORD_TYPES = [
  { value: 'n', short: 'n', label: 'Danh từ' },
  { value: 'v', short: 'v', label: 'Động từ' },
  { value: 'adj', short: 'adj', label: 'Tính từ' },
  { value: 'adv', short: 'adv', label: 'Trạng từ' },
  { value: 'phr', short: 'phr', label: 'Cụm từ' },
  { value: 'other', short: '…', label: 'Khác' },
]

export function typeInfo(value) {
  return WORD_TYPES.find((type) => type.value === value) ?? WORD_TYPES.at(-1)
}

// "0 words", "1 word", "5 words" (the wireframe keeps this in English, like IELTS)
export function wordCountLabel(count) {
  return `${count} ${count === 1 ? 'word' : 'words'}`
}

// "sustainable · mitigate · biodiversity", or a hint when the set is empty
export function previewLabel(preview) {
  return preview.length ? preview.join(' · ') : 'Chưa có từ nào'
}

// Words whose term, meaning or note contains the search text (ignoring case and Vietnamese accents)
export function filterWords(words, query) {
  const plain = (value) => (value ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()
  const needle = plain(query).trim()
  if (needle === '') return words
  return words.filter((word) => [word.term, word.meaning, word.note].some((field) => plain(field).includes(needle)))
}

// An empty form, or the fields of the word being edited
export function wordForm(word = null) {
  return {
    type: word?.type ?? 'n',
    term: word?.term ?? '',
    meaning: word?.meaning ?? '',
    note: word?.note ?? '',
    verbForms: word?.verbForms ?? '',
    collocations: word?.collocations ?? '',
    example: word?.example ?? '',
  }
}
