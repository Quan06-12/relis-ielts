export const DEV_USER = '111111111111111111111111'
const qid = (i) => i.toString(16).padStart(24, '0')
const types = ['completion', 'mcq', 'multi_select', 'tfng', 'ynng', 'matching', 'short_answer']
export function fixtureTests() {
  return ['reading', 'listening'].map((skill, n) => ({
    id: `${n + 2}`.repeat(24),
    ownerId: DEV_USER,
    title: `${skill === 'reading' ? 'Reading' : 'Listening'} · City transport (dev)`,
    skill,
    kind: 'full',
    status: 'published',
    durationMin: 60,
    questionCount: 40,
    sections: Array.from({ length: skill === 'reading' ? 3 : 4 }, (_, sectionIndex) => ({
      title: `Phần ${sectionIndex + 1}`,
      passage:
        skill === 'reading'
          ? 'The red bus connects the city centre with the park. Ten passengers travel every morning. Walking and cycling are encouraged.'
          : '',
      audioUrl: skill === 'listening' ? 'http://localhost:5000/dev/audio.wav' : null,
      audioDurationSec: skill === 'listening' ? 3 : null,
      transcript:
        skill === 'listening'
          ? 'The red bus connects the city centre with the park. Ten passengers travel every morning.'
          : '',
      groups: Array.from(
        {
          length:
            sectionIndex === 0 ? (skill === 'reading' ? 14 : 10) : skill === 'reading' ? 13 : 10,
        },
        (_, i) => {
          const number =
            skill === 'reading'
              ? (sectionIndex === 0 ? 0 : sectionIndex === 1 ? 14 : 27) + i + 1
              : sectionIndex * 10 + i + 1
          const type = types[(number - 1) % types.length]
          const choices = {
            mcq: ['Red', 'Blue', 'Green'],
            multi_select: ['Walking', 'Driving', 'Cycling'],
            tfng: ['TRUE', 'FALSE', 'NOT GIVEN'],
            ynng: ['YES', 'NO', 'NOT GIVEN'],
            matching: ['A', 'B', 'C'],
          }
          return {
            type,
            instruction:
              type === 'multi_select' ? 'Chọn hai đáp án đúng.' : 'Chọn hoặc nhập đáp án phù hợp.',
            questions: [
              {
                id: qid((n + 1) * 100 + number),
                number,
                prompt:
                  type === 'multi_select'
                    ? 'Which activities are encouraged?'
                    : type === 'mcq'
                      ? 'What colour is the bus?'
                      : type === 'tfng'
                        ? 'The bus goes to the park.'
                        : type === 'ynng'
                          ? 'The writer supports walking.'
                          : type === 'matching'
                            ? 'Match the city route (A).'
                            : 'How many passengers travel every morning?',
                options: choices[type] || [],
                answers:
                  type === 'multi_select'
                    ? ['Walking', 'Cycling']
                    : type === 'mcq'
                      ? ['Red']
                      : type === 'tfng'
                        ? ['TRUE']
                        : type === 'ynng'
                          ? ['YES']
                          : type === 'matching'
                            ? ['A']
                            : ['ten', '10'],
                explanation: ['Đối chiếu thông tin trong đoạn văn hoặc bản chép lời.'],
                evidence: { start: 4, end: 11 },
              },
            ],
          }
        },
      ),
    })),
  }))
}
