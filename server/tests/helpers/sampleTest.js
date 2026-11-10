// A small Reading test (2 passages, 3 questions) used by several test files.
export function sampleSections() {
  return [
    {
      title: 'Passage 1',
      passage: 'Rooftop gardens cool the city. They also reduce noise.',
      groups: [
        {
          type: 'tfng',
          instruction: 'Do the statements agree with the passage?',
          questions: [
            { prompt: 'Rooftop gardens cool the city.', options: ['TRUE', 'FALSE', 'NOT GIVEN'], answers: ['TRUE'] },
            { prompt: 'They increase noise.', options: ['TRUE', 'FALSE', 'NOT GIVEN'], answers: ['FALSE'] },
          ],
        },
      ],
    },
    {
      title: 'Passage 2',
      passage: 'The first bicycle had no pedals.',
      groups: [
        {
          type: 'completion',
          instruction: 'Write ONE WORD.',
          questions: [{ prompt: 'The first bicycle had no ____.', answers: ['pedals'] }],
        },
      ],
    },
  ]
}
