import { findEvidence } from '../src/utils/evidenceRange.js'

// Demo content for the class presentation: one full Reading test (3 passages, 40 questions,
// so it gets a band) and one short single-passage test. The passages were written for this
// project. Every question has accepted answers, an explanation and evidence in the passage.

const TFNG = ['TRUE', 'FALSE', 'NOT GIVEN']

// One question. `quote` must be copied exactly from the passage; its position becomes the evidence.
function question(passage, { prompt, answers, explanation, quote, options = [] }) {
  return { prompt, options, answers, explanation, evidence: findEvidence(passage, quote) }
}

function section(title, passage, groups) {
  return {
    title,
    passage,
    groups: groups.map((group) => ({
      type: group.type,
      instruction: group.instruction,
      questions: group.questions.map((item) => question(passage, { options: group.options ?? [], ...item })),
    })),
  }
}

const PASSAGE_1 = `As cities expand, more of their surface is covered by concrete, glass and asphalt. These materials absorb heat during the day and release it slowly at night, which is why city centres are often several degrees warmer than the countryside around them. One response that has spread quickly over the last twenty years is the green roof: a layer of soil and plants laid on top of a building.

The idea is not new. Houses with grass roofs have been built in Scandinavia for centuries, mainly because the thick layer of turf kept warmth inside during long winters. Modern green roofs are lighter and thinner. Most use a waterproof sheet, a drainage layer and only ten to fifteen centimetres of growing material, planted with hardy species such as sedum that need little water.

Supporters point to several benefits. In summer, a planted roof can be up to thirty degrees cooler than a dark one, which reduces the energy needed for air conditioning in the rooms below. Plants and soil also hold rainwater, so less of it rushes into drains during heavy storms. Some city councils now offer grants to owners who install them.

There are drawbacks, however. A green roof costs roughly twice as much as a conventional one to build, and older buildings may need extra support to carry the weight of wet soil. Maintenance is also required: weeds must be removed and dry patches replanted, at least in the first few years.`

const PASSAGE_2 = `For much of the twentieth century, sleeper trains linked the major cities of Europe. Passengers boarded in the evening, slept in small cabins and woke up hundreds of kilometres away. By the early 2000s, however, many of these services had disappeared. Cheap flights were faster, and railway companies found the trains expensive to run, because each carriage carried far fewer people than a daytime train.

Recently the picture has begun to change. Several operators have introduced new routes, and some old ones have been brought back. The main reason is concern about climate change: a journey by train produces a small fraction of the carbon emissions of the same trip by air. Surveys suggest that younger travellers in particular are willing to spend more time travelling if it means a smaller environmental impact.

Comfort is another factor. Modern sleeper carriages offer private compartments with their own washbasins, and some include a shower. For business travellers, arriving in the city centre at breakfast time can be more convenient than taking an early flight and then a taxi from an airport far outside town.

Problems remain. Tickets are often more expensive than flights, partly because trains must pay a fee for every country whose tracks they use. Finding enough modern carriages is also difficult, since only a few factories still build them. Even so, rail experts expect the network to keep growing over the next decade.`

const PASSAGE_3 = `Scientists have long suspected that sleep plays a part in memory, but only in recent decades have they been able to observe what happens in the brain at night. The picture that has emerged is of a busy organ that sorts and stores the experiences of the day while the body rests.

During the day, new information is held for a short time in a region called the hippocampus. Research on animals has shown that during deep sleep, the hippocampus replays recent events, sending signals to the outer layer of the brain, the cortex, where memories can be kept for many years. Without this transfer, much of what we learn seems to fade within days.

Different stages of sleep appear to support different kinds of memory. Deep sleep, which is most common early in the night, seems especially important for facts, such as new words in a foreign language. Dreaming sleep, which becomes longer towards the morning, seems to help with skills and with linking ideas together in new ways.

The practical lessons are simple. Students who stay up all night before an exam may remember less than those who study for fewer hours and then sleep normally. In one well-known experiment, people who slept after learning a list of word pairs recalled about twenty per cent more of them the next day than people who stayed awake. Short naps can also help, although they are less effective than a full night of sleep.`

export function demoReadingTest() {
  return {
    title: 'Reading Practice Test 1',
    skill: 'reading',
    kind: 'full',
    durationMin: 60,
    coverUrl: '/landing/rooftop.jpg', // photos in client/public/landing
    sections: [
      section('Green Roofs in Growing Cities', PASSAGE_1, [
        {
          type: 'tfng',
          instruction: 'Do the following statements agree with the information given in the passage? Choose TRUE, FALSE or NOT GIVEN.',
          options: TFNG,
          questions: [
            { prompt: 'City centres are usually warmer than the surrounding countryside.', answers: ['TRUE'], quote: 'city centres are often several degrees warmer than the countryside around them', explanation: ['The passage says city centres are "often several degrees warmer" than the countryside.', 'This matches the statement, so the answer is TRUE.'] },
            { prompt: 'Green roofs were first invented about twenty years ago.', answers: ['FALSE'], quote: 'The idea is not new. Houses with grass roofs have been built in Scandinavia for centuries', explanation: ['Green roofs spread quickly in the last twenty years, but the idea is centuries old.', 'The statement contradicts the passage: FALSE.'] },
            { prompt: 'Traditional Scandinavian grass roofs helped keep houses warm.', answers: ['TRUE'], quote: 'the thick layer of turf kept warmth inside during long winters', explanation: ['The turf "kept warmth inside during long winters".', 'So the statement is TRUE.'] },
            { prompt: 'Modern green roofs are heavier than traditional ones.', answers: ['FALSE'], quote: 'Modern green roofs are lighter and thinner.', explanation: ['The passage says modern green roofs are "lighter and thinner".', 'Heavier is the opposite: FALSE.'] },
            { prompt: 'Sedum is the most expensive plant used on green roofs.', answers: ['NOT GIVEN'], quote: 'planted with hardy species such as sedum that need little water', explanation: ['Sedum is mentioned only as a hardy plant that needs little water.', 'Nothing is said about its price: NOT GIVEN.'] },
            { prompt: 'A planted roof can reduce the need for air conditioning.', answers: ['TRUE'], quote: 'which reduces the energy needed for air conditioning in the rooms below', explanation: ['A cooler roof "reduces the energy needed for air conditioning".', 'The statement agrees: TRUE.'] },
            { prompt: 'All city councils pay for green roofs to be installed.', answers: ['FALSE'], quote: 'Some city councils now offer grants', explanation: ['Only "some" councils offer grants.', '"All" councils paying contradicts this: FALSE.'] },
          ],
        },
        {
          type: 'completion',
          instruction: 'Complete the sentences. Choose ONE WORD ONLY from the passage for each answer.',
          questions: [
            { prompt: 'Concrete and glass absorb ____ during the day.', answers: ['heat'], quote: 'These materials absorb heat during the day', explanation: ['The materials "absorb heat during the day".', 'Answer: heat.'] },
            { prompt: 'A modern green roof starts with a waterproof ____.', answers: ['sheet'], quote: 'Most use a waterproof sheet', explanation: ['The first layer listed is "a waterproof sheet".', 'Answer: sheet.'] },
            { prompt: 'Plants and soil hold ____, so drains receive less water in storms.', answers: ['rainwater'], quote: 'Plants and soil also hold rainwater', explanation: ['"Plants and soil also hold rainwater".', 'Answer: rainwater.'] },
            { prompt: 'A green roof costs about ____ as much as a conventional roof.', answers: ['twice'], quote: 'costs roughly twice as much as a conventional one', explanation: ['It "costs roughly twice as much".', 'Answer: twice.'] },
            { prompt: 'Older buildings may need extra ____ for the weight of wet soil.', answers: ['support'], quote: 'older buildings may need extra support', explanation: ['"older buildings may need extra support".', 'Answer: support.'] },
            { prompt: 'In the first years, ____ must be removed from the roof.', answers: ['weeds'], quote: 'weeds must be removed', explanation: ['Maintenance means "weeds must be removed".', 'Answer: weeds.'] },
          ],
        },
      ]),
      section('The Slow Return of the Night Train', PASSAGE_2, [
        {
          type: 'mcq',
          instruction: 'Choose the correct letter, A, B, C or D.',
          questions: [
            {
              prompt: 'Why did many sleeper services close in the early 2000s?',
              options: ['A. Passengers disliked sleeping on trains', 'B. Flights were cheaper and quicker', 'C. Old tracks were unsafe', 'D. Governments banned them'],
              answers: ['B. Flights were cheaper and quicker'],
              quote: 'Cheap flights were faster',
              explanation: ['The passage gives "Cheap flights were faster" as a reason.', 'Option B says the same thing.'],
            },
            {
              prompt: 'Why were sleeper trains expensive to run?',
              options: ['A. Each carriage carried fewer people', 'B. Staff were paid more at night', 'C. The trains used more fuel', 'D. Cabins needed daily cleaning'],
              answers: ['A. Each carriage carried fewer people'],
              quote: 'each carriage carried far fewer people than a daytime train',
              explanation: ['They were costly "because each carriage carried far fewer people".', 'That is option A.'],
            },
            {
              prompt: 'What is the main reason for the return of night trains?',
              options: ['A. Faster engines', 'B. Lower ticket prices', 'C. Concern about climate change', 'D. Fewer airports'],
              answers: ['C. Concern about climate change'],
              quote: 'The main reason is concern about climate change',
              explanation: ['The passage states "The main reason is concern about climate change".', 'Answer C.'],
            },
            {
              prompt: 'According to surveys, which group is most willing to travel longer to reduce its impact?',
              options: ['A. Business travellers', 'B. Younger travellers', 'C. Families with children', 'D. Retired people'],
              answers: ['B. Younger travellers'],
              quote: 'younger travellers in particular are willing to spend more time travelling',
              explanation: ['"younger travellers in particular are willing to spend more time travelling".', 'Answer B.'],
            },
            {
              prompt: 'Why might business travellers prefer a sleeper train?',
              options: ['A. It is cheaper than a hotel', 'B. They can hold meetings on board', 'C. It arrives in the city centre in the morning', 'D. Airports are closed at night'],
              answers: ['C. It arrives in the city centre in the morning'],
              quote: 'arriving in the city centre at breakfast time can be more convenient',
              explanation: ['Arriving "in the city centre at breakfast time" is more convenient than a flight and taxi.', 'Answer C.'],
            },
          ],
        },
        {
          type: 'tfng',
          instruction: 'Do the following statements agree with the information given in the passage? Choose TRUE, FALSE or NOT GIVEN.',
          options: TFNG,
          questions: [
            { prompt: 'Some old sleeper routes have been restarted.', answers: ['TRUE'], quote: 'some old ones have been brought back', explanation: ['"some old ones have been brought back".', 'TRUE.'] },
            { prompt: 'Every modern sleeper carriage has a shower.', answers: ['FALSE'], quote: 'and some include a shower', explanation: ['Only "some" carriages include a shower.', '"Every" contradicts this: FALSE.'] },
            { prompt: 'Night train tickets are always cheaper than flights.', answers: ['FALSE'], quote: 'Tickets are often more expensive than flights', explanation: ['Tickets are "often more expensive than flights".', 'FALSE.'] },
            { prompt: 'Most sleeper carriages are built in Germany.', answers: ['NOT GIVEN'], quote: 'only a few factories still build them', explanation: ['The passage says only a few factories build them, but not where.', 'NOT GIVEN.'] },
          ],
        },
        {
          type: 'short_answer',
          instruction: 'Answer the questions. Choose NO MORE THAN TWO WORDS from the passage for each answer.',
          questions: [
            { prompt: 'In what kind of rooms did passengers sleep?', answers: ['small cabins', 'cabins'], quote: 'slept in small cabins', explanation: ['Passengers "slept in small cabins".', 'Answer: small cabins (cabins is also accepted).'] },
            { prompt: 'What must trains pay for each country whose tracks they use?', answers: ['a fee', 'fee'], quote: 'trains must pay a fee for every country', explanation: ['Trains "must pay a fee for every country whose tracks they use".', 'Answer: (a) fee.'] },
            { prompt: 'Who expect the network to grow over the next decade?', answers: ['rail experts'], quote: 'rail experts expect the network to keep growing', explanation: ['"rail experts expect the network to keep growing".', 'Answer: rail experts.'] },
            { prompt: 'What do private compartments have, apart from a bed?', answers: ['washbasins', 'their own washbasins'], quote: 'private compartments with their own washbasins', explanation: ['Compartments come "with their own washbasins".', 'Answer: washbasins.'] },
          ],
        },
      ]),
      section('Why Sleep Helps Us Remember', PASSAGE_3, [
        {
          type: 'mcq',
          instruction: 'Choose the correct letter, A, B, C or D.',
          questions: [
            {
              prompt: 'What has changed in sleep research in recent decades?',
              options: ['A. Scientists first linked sleep to memory', 'B. Scientists can observe the brain at night', 'C. People sleep fewer hours', 'D. Animals are no longer studied'],
              answers: ['B. Scientists can observe the brain at night'],
              quote: 'only in recent decades have they been able to observe what happens in the brain at night',
              explanation: ['The link was suspected long ago; what is new is being able to "observe what happens in the brain at night".', 'Answer B.'],
            },
            {
              prompt: 'Where is new information first held?',
              options: ['A. In the cortex', 'B. In the outer layer of the brain', 'C. In the hippocampus', 'D. In long-term memory'],
              answers: ['C. In the hippocampus'],
              quote: 'new information is held for a short time in a region called the hippocampus',
              explanation: ['New information "is held for a short time in a region called the hippocampus".', 'Answer C.'],
            },
            {
              prompt: 'What happens during deep sleep, according to animal research?',
              options: ['A. The hippocampus replays recent events', 'B. The cortex stops working', 'C. Old memories are deleted', 'D. Dreams become longer'],
              answers: ['A. The hippocampus replays recent events'],
              quote: 'the hippocampus replays recent events',
              explanation: ['"during deep sleep, the hippocampus replays recent events".', 'Answer A.'],
            },
            {
              prompt: 'Which kind of memory does dreaming sleep seem to help most?',
              options: ['A. Facts and new words', 'B. Skills and linking ideas', 'C. Names of people', 'D. Numbers'],
              answers: ['B. Skills and linking ideas'],
              quote: 'seems to help with skills and with linking ideas together in new ways',
              explanation: ['Dreaming sleep "seems to help with skills and with linking ideas together".', 'Facts are linked to deep sleep instead. Answer B.'],
            },
            {
              prompt: 'What does the writer say about short naps?',
              options: ['A. They are useless', 'B. They are better than a full night', 'C. They help, but less than a full night', 'D. They cause poor memory'],
              answers: ['C. They help, but less than a full night'],
              quote: 'Short naps can also help, although they are less effective than a full night of sleep',
              explanation: ['Naps "can also help, although they are less effective than a full night of sleep".', 'Answer C.'],
            },
          ],
        },
        {
          type: 'completion',
          instruction: 'Complete the summary. Choose ONE WORD ONLY from the passage for each answer.',
          questions: [
            { prompt: 'Memories that are kept for many years are stored in the ____.', answers: ['cortex'], quote: 'the outer layer of the brain, the cortex, where memories can be kept for many years', explanation: ['Signals go to "the cortex, where memories can be kept for many years".', 'Answer: cortex.'] },
            { prompt: 'Without the transfer during sleep, much new learning seems to ____ within days.', answers: ['fade'], quote: 'much of what we learn seems to fade within days', explanation: ['"much of what we learn seems to fade within days".', 'Answer: fade.'] },
            { prompt: 'Deep sleep is most common early in the ____.', answers: ['night'], quote: 'Deep sleep, which is most common early in the night', explanation: ['Deep sleep "is most common early in the night".', 'Answer: night.'] },
            { prompt: 'Dreaming sleep becomes longer towards the ____.', answers: ['morning'], quote: 'Dreaming sleep, which becomes longer towards the morning', explanation: ['Dreaming sleep "becomes longer towards the morning".', 'Answer: morning.'] },
            { prompt: 'People who slept after learning word pairs recalled about twenty ____ more of them.', answers: ['per cent', 'percent'], quote: 'recalled about twenty per cent more of them', explanation: ['They "recalled about twenty per cent more".', 'Answer: per cent (percent is also accepted).'] },
          ],
        },
        {
          type: 'tfng',
          instruction: 'Do the following statements agree with the information given in the passage? Choose TRUE, FALSE or NOT GIVEN.',
          options: TFNG,
          questions: [
            { prompt: 'The brain is inactive while the body sleeps.', answers: ['FALSE'], quote: 'a busy organ that sorts and stores the experiences of the day while the body rests', explanation: ['The brain is described as "a busy organ" at night.', 'Inactive contradicts this: FALSE.'] },
            { prompt: 'Deep sleep is important for learning words in a foreign language.', answers: ['TRUE'], quote: 'especially important for facts, such as new words in a foreign language', explanation: ['Deep sleep is "especially important for facts, such as new words in a foreign language".', 'TRUE.'] },
            { prompt: 'Students who study all night may remember less in an exam.', answers: ['TRUE'], quote: 'Students who stay up all night before an exam may remember less', explanation: ['"Students who stay up all night before an exam may remember less".', 'TRUE.'] },
            { prompt: 'The word-pair experiment was carried out with children.', answers: ['NOT GIVEN'], quote: 'In one well-known experiment, people who slept after learning a list of word pairs', explanation: ['The passage only says "people"; their age is not mentioned.', 'NOT GIVEN.'] },
          ],
        },
      ]),
    ],
  }
}

// A short single-passage test, for showing "practise one passage" and a class assignment
// Passage 2 of the full test on its own: a short test to assign as homework
export function demoShortTest() {
  return {
    title: 'The Slow Return of the Night Train',
    skill: 'reading',
    kind: 'single',
    durationMin: 20,
    coverUrl: '/landing/mountains.jpg',
    sections: [demoReadingTest().sections[1]],
  }
}
