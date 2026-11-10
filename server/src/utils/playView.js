// Allowlist deliberately prevents new private fields from leaking through future schemas.
export function toPlayView(test) {
  return {
    id: test.id,
    title: test.title,
    skill: test.skill,
    kind: test.kind,
    durationMin: test.durationMin,
    questionCount: test.questionCount,
    sections: test.sections.map((s) => ({
      title: s.title,
      passage: s.passage,
      audioUrl: s.audioUrl,
      audioDurationSec: s.audioDurationSec,
      groups: s.groups.map((g) => ({
        type: g.type,
        instruction: g.instruction,
        questions: g.questions.map((q) => ({
          id: q.id,
          number: q.number,
          prompt: q.prompt,
          options: q.options,
        })),
      })),
    })),
  }
}
