import { validationError } from '../errors/AppError.js'

// Checks the mode chosen in the "choose mode" dialog (US24, US25) against the test.
// Returns a clean mode object, or throws a validation error listing what is wrong.
export function checkMode(mode, test) {
  const sectionCount = test.sections.length
  const problems = []

  if (!mode || !['full', 'parts'].includes(mode.type)) {
    problems.push({ field: 'mode.type', message: 'type must be full or parts' })
  }

  const indexes = Array.isArray(mode?.sectionIndexes) ? [...new Set(mode.sectionIndexes)].sort((a, b) => a - b) : []
  const indexesAreValid = indexes.length > 0 && indexes.every((index) => Number.isInteger(index) && index >= 0 && index < sectionCount)
  if (!indexesAreValid) {
    problems.push({ field: 'mode.sectionIndexes', message: `choose at least one section between 0 and ${sectionCount - 1}` })
  }

  // A "full" attempt must contain every section, otherwise its band would be meaningless
  if (mode?.type === 'full' && indexes.length !== sectionCount) {
    problems.push({ field: 'mode.sectionIndexes', message: 'a full attempt includes every section' })
  }

  const minutes = mode?.timeLimitMin
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 180) {
    problems.push({ field: 'mode.timeLimitMin', message: 'timeLimitMin must be a whole number from 1 to 180' })
  }

  if (problems.length > 0) {
    throw validationError(problems)
  }

  return { type: mode.type, sectionIndexes: indexes, timeLimitMin: minutes }
}
