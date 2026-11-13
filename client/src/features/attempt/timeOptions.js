// Time choices in the choose-mode dialog (US25). Pure functions, unit tested.

const FULL_TEST = {
  reading: { choices: [50, 55, 60, 65, 70], default: 60 },
  listening: { choices: [30, 35, 40, 45, 50], default: 40 },
}

const ONE_SECTION = {
  reading: { choices: [10, 15, 20, 25, 30], default: 20 },
  listening: { choices: [5, 10, 15, 20], default: 10 },
}

// For several sections, every choice is multiplied by the number of sections.
export function timeChoices(skill, isFullTest, sectionCount) {
  if (isFullTest) return FULL_TEST[skill]
  const perSection = ONE_SECTION[skill]
  return {
    choices: perSection.choices.map((minutes) => minutes * sectionCount),
    default: perSection.default * sectionCount,
  }
}
