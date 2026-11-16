import { findEvidence } from '../src/utils/evidenceRange.js'

// Listening tests for the demo account, written for this project in the IELTS format.
// The recordings in client/public/listening were made from these transcripts with an offline
// text-to-speech engine, one voice per speaker. Every question has accepted answers, an explanation and
// evidence copied exactly from the transcript, so the review page can highlight it.

const TITLES = {
  part1: 'Joining the Riverside Sports Centre',
  part2: 'A Visit to Hartwell Castle',
  part3: 'Planning a Project on City Cycling',
  part4: 'How Animals Sleep',
}

// Length of each recording in seconds (from ffprobe), used by the time warning (US26)
const DURATIONS = { part1: 133, part2: 158, part3: 145, part4: 146 }

// ---- Transcripts. One speaker per line: "NAME: words". ----

export const TRANSCRIPTS = {
  part1: `NARRATOR: Part 1. You will hear a man phoning a sports centre to ask about joining. First, look at questions 1 to 10.
RECEPTIONIST: Good morning, Riverside Sports Centre. How can I help you?
DANIEL: Hi. I've just moved to the area and I'd like to become a member.
RECEPTIONIST: Lovely. I can take your details now. What's your name, please?
DANIEL: Daniel Harper. That's H, A, R, P, E, R.
RECEPTIONIST: Thank you, Mr Harper. And your address?
DANIEL: It's 27 Kingsley Street. Kingsley is K, I, N, G, S, L, E, Y.
RECEPTIONIST: Got it. Is there a particular activity you're interested in?
DANIEL: I'd mainly like to use the gym, but my doctor suggested I try something for my back, so I'm thinking of the yoga class.
RECEPTIONIST: Good choice. Yoga is on Tuesday evenings at seven. Now, we have three types of membership. Are you working at the moment, or studying?
DANIEL: I'm a student at the college, actually, on a part-time course.
RECEPTIONIST: Then you can have our student membership. It's thirty-two pounds a month, and that includes all classes.
DANIEL: Thirty-two? That's cheaper than I expected.
RECEPTIONIST: It's a good deal. You'll need to show your student card when you sign up, and please bring a photo on your first visit. We use it for your membership card.
DANIEL: No problem. What about lockers? I'll be coming straight from college with my bag.
RECEPTIONIST: The lockers are free to use, but there's a deposit of five pounds for the key. You get it back when you return the key.
DANIEL: Fine. And is there anywhere to park? I sometimes borrow my sister's car.
RECEPTIONIST: Yes, the car park behind the building is free for members for two hours. After that you pay at the machine.
DANIEL: Two hours is plenty. When can I start?
RECEPTIONIST: Memberships begin on the first day of a week. The next start date is Monday the fourteenth of March.
DANIEL: The fourteenth. Perfect.
RECEPTIONIST: One last question, just for our records. How did you hear about us?
DANIEL: I saw your advertisement in the local newspaper.
RECEPTIONIST: Great, thank you. I'll email you the forms today, Mr Harper.`,

  part2: `NARRATOR: Part 2. You will hear a guide talking to visitors at the start of a tour of a castle. First, look at questions 11 to 15.
GUIDE: Good afternoon, everyone, and welcome to Hartwell Castle. My name is Simon and I'll be looking after you today. Before we set off, let me tell you a little about the castle and how the afternoon will work.
GUIDE: The castle was built in the twelfth century, but what you will see today is mostly from a later period. After a fire in 1540 destroyed much of the original building, the family rebuilt it in stone, and those walls are still standing.
GUIDE: Many people think the castle was built to defend the river crossing. In fact, its main purpose was to show the wealth of the family who owned the land. It was never attacked.
GUIDE: The tour lasts about ninety minutes. We'll walk quite a lot, so if anyone needs to rest, please tell me. There are benches in every room.
GUIDE: Photography is allowed everywhere except in the library, because strong light can damage the old books. So please put your cameras away when we reach it.
GUIDE: The castle now belongs to a charity. The money from your tickets pays mainly for repairs to the roof, which is the most expensive part of the building to look after.
NARRATOR: Now look at questions 16 to 20.
GUIDE: Now, let me explain what you can do in different parts of the castle after the tour.
GUIDE: The Great Hall is the largest room. On weekend afternoons a small group plays live music there, using copies of old instruments.
GUIDE: Behind the castle is the kitchen garden, where vegetables are still grown in the old way. That's the best place for a picnic, and there are tables near the gate.
GUIDE: I'm afraid the East Tower is closed this month while we repair the stairs, so you can't go inside, although you can see it from the courtyard.
GUIDE: The old stables have been turned into a play area, with children's games and dressing-up clothes, so it's very popular with families.
GUIDE: And finally, down by the lake you'll find our shop, where you can buy books, postcards and honey from the castle's own bees.
GUIDE: Right, if everyone is ready, please follow me to the Great Hall.`,

  part3: `NARRATOR: Part 3. You will hear two students, Maya and Tom, talking to their tutor about a project on cycling in cities. First, look at questions 21 to 25.
TUTOR: So, Maya, Tom, you've chosen cycling in cities for your project. Why that topic?
MAYA: Well, we both cycle to university, and we noticed that the number of cyclists in town has grown a lot. We wanted to find out what makes people choose a bike.
TOM: And whether the city could do more to help them.
TUTOR: Good. How are you going to collect your information?
TOM: We started with an online survey, but very few people answered it. So now we're planning to interview cyclists face to face at the main bike parks.
TUTOR: That sounds more reliable. What did you find most surprising so far?
MAYA: I expected people to say cycling was cheaper. But the most common reason was that it's faster than the bus at rush hour.
TUTOR: Interesting. And what stops people from cycling?
TOM: Safety, mostly. Lots of people told us the roads near the station feel dangerous because there's no separate lane.
TUTOR: Have you looked at what other cities have done?
MAYA: Yes. We read about Copenhagen, of course, but we decided to focus on a smaller city that's more like ours, so we chose Utrecht.
TUTOR: Sensible. Copenhagen is very different in size.
NARRATOR: Now look at questions 26 to 30.
TUTOR: Let's talk about your plan for the next few weeks.
TOM: First, we'll finish the interviews by the end of this month. We're aiming for about sixty people.
MAYA: Then we'll put the answers into a spreadsheet and make some charts.
TUTOR: Don't forget to include a map. A map of the bike lanes would make your recommendations much clearer.
TOM: Good idea. The council has a website with that information, so we can use their data.
MAYA: We'd also like to speak to someone from the council's transport department, if possible.
TUTOR: I can give you a contact. Email me and I'll send you the name.
TOM: Thank you. And the deadline for the report is still the second of December?
TUTOR: That's right. And you'll also give a short presentation to the class, about ten minutes.
MAYA: Great. We'll start practising early, then.`,

  part4: `NARRATOR: Part 4. You will hear a lecture about how animals sleep. First, look at questions 31 to 40.
LECTURER: Today I'd like to look at sleep, not in humans, but in other animals, and at what it tells us about why we sleep at all.
LECTURER: For a long time, scientists believed that only animals with large brains needed sleep. We now know this is wrong. Even tiny creatures such as fruit flies have periods of rest during which they respond less to the world around them, and if they are kept awake, they sleep longer the next day.
LECTURER: The amount of sleep varies enormously. A brown bat may sleep for nearly twenty hours a day, while a giraffe in the wild sleeps for less than five, often in short periods of a few minutes at a time.
LECTURER: One reason for this difference seems to be danger. Animals that are often hunted, like giraffes, cannot afford long periods of deep sleep, because they would be easy to catch. Animals with safe places to rest, such as bats in caves, can sleep much longer.
LECTURER: Diet matters too. Animals that eat grass need to spend many hours feeding, because grass contains little energy, so they have less time left for sleeping.
LECTURER: Some animals have found remarkable ways to rest. Dolphins, for example, must come to the surface to breathe, so they cannot fall completely unconscious. Instead, they sleep with one half of the brain at a time, while the other half stays alert. Many birds do the same, especially when they sleep in a group. The birds at the edge of the group keep one eye open, watching for danger.
LECTURER: Migrating birds face a different problem. On journeys that last several days, they take very short naps, sometimes lasting only a few seconds, even while flying.
LECTURER: So why do animals sleep? One popular idea is that sleep saves energy, since body temperature falls during rest. But this cannot be the whole story, because the brain remains very active during some stages of sleep.
LECTURER: A newer theory is that sleep allows the brain to clean itself. During sleep, fluid flows through the brain and removes waste that builds up during the day.
LECTURER: There is also strong evidence that sleep helps with memory. In experiments, rats that ran through a maze showed the same pattern of brain activity again while they slept, as if they were practising the route.
LECTURER: In the next lecture, we'll look at what happens to people who work at night, and how this affects their health.`,
}

// ---- Questions ----

const COMPLETION_ONE_WORD_OR_NUMBER = 'Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer.'
const COMPLETION_ONE_WORD = 'Complete the notes below. Write ONE WORD ONLY for each answer.'
const CHOOSE_ABC = 'Choose the correct letter, A, B or C.'

function item(transcript, { prompt, answers, quote, explanation, options = [] }) {
  return { prompt, options, answers, explanation, evidence: findEvidence(transcript, quote) }
}

function groupsFor(part) {
  const transcript = TRANSCRIPTS[part]
  const make = (items, options) => items.map((entry) => item(transcript, { ...entry, options: entry.options ?? options ?? [] }))

  if (part === 'part1') {
    return [
      {
        type: 'completion',
        instruction: `${COMPLETION_ONE_WORD_OR_NUMBER}`,
        questions: make([
          { prompt: 'Name: Daniel ____', answers: ['Harper'], quote: "Daniel Harper. That's H, A, R, P, E, R.", explanation: ['He spells his family name: H, A, R, P, E, R.', 'Answer: Harper.'] },
          { prompt: 'Address: 27 ____ Street', answers: ['Kingsley'], quote: "It's 27 Kingsley Street. Kingsley is K, I, N, G, S, L, E, Y.", explanation: ['The street is spelled K, I, N, G, S, L, E, Y.', 'Answer: Kingsley.'] },
          { prompt: 'Class he wants to join: ____ (Tuesday evenings)', answers: ['yoga'], quote: "I'm thinking of the yoga class.", explanation: ['His doctor suggested something for his back, so he chooses the yoga class.', 'The gym is what he will "mainly" use, but it is not a class. Answer: yoga.'] },
          { prompt: 'Type of membership: ____', answers: ['student'], quote: 'Then you can have our student membership.', explanation: ['He studies part-time at the college.', 'Answer: student.'] },
          { prompt: 'Cost per month: £ ____', answers: ['32', 'thirty-two', 'thirty two'], quote: "It's thirty-two pounds a month", explanation: ['The receptionist says "thirty-two pounds a month".', 'Answer: 32.'] },
          { prompt: 'Bring a ____ on the first visit', answers: ['photo', 'photograph'], quote: 'please bring a photo on your first visit', explanation: ['The photo is used for the membership card.', 'The student card is shown when signing up, not on the first visit. Answer: photo.'] },
          { prompt: 'Deposit for locker key: £ ____', answers: ['5', 'five'], quote: "there's a deposit of five pounds for the key", explanation: ['Lockers are free, but the key needs a deposit of five pounds.', 'Answer: 5.'] },
          { prompt: 'Car park: free for ____ hours', answers: ['2', 'two'], quote: 'free for members for two hours', explanation: ['Members park free "for two hours".', 'Answer: 2.'] },
          { prompt: 'Start date: Monday ____ March', answers: ['14', '14th', 'fourteenth', 'the fourteenth'], quote: 'Monday the fourteenth of March', explanation: ['Memberships start on a Monday: "the fourteenth of March".', 'Answer: 14(th).'] },
          { prompt: 'Heard about the centre in the local ____', answers: ['newspaper', 'paper'], quote: 'I saw your advertisement in the local newspaper.', explanation: ['He saw an advertisement "in the local newspaper".', 'Answer: newspaper.'] },
        ]),
      },
    ]
  }

  if (part === 'part2') {
    const PLACES = ['A. live music', 'B. picnic tables', 'C. closed this month', "D. children's games", 'E. shop', 'F. guided talks only']
    return [
      {
        type: 'mcq',
        instruction: `${CHOOSE_ABC}`,
        questions: make([
          { prompt: 'Most of the castle that visitors see today was built', options: ['A. in the twelfth century.', 'B. after a fire in 1540.', 'C. in the last hundred years.'], answers: ['B. after a fire in 1540.'], quote: 'After a fire in 1540 destroyed much of the original building, the family rebuilt it in stone', explanation: ['The castle was first built in the twelfth century, but it was rebuilt after the fire of 1540.', '"What you will see today is mostly from a later period": B.'] },
          { prompt: 'The main purpose of the castle was to', options: ['A. defend the river crossing.', "B. show the family's wealth.", 'C. protect the town from attack.'], answers: ["B. show the family's wealth."], quote: 'its main purpose was to show the wealth of the family who owned the land', explanation: ['The guide says many people think it defended the river crossing, "In fact" it showed the family\'s wealth.', 'Answer: B.'] },
          { prompt: 'How long does the tour last?', options: ['A. about an hour', 'B. about ninety minutes', 'C. about two hours'], answers: ['B. about ninety minutes'], quote: 'The tour lasts about ninety minutes.', explanation: ['"The tour lasts about ninety minutes."', 'Answer: B.'] },
          { prompt: 'Visitors cannot take photographs in', options: ['A. the library.', 'B. the Great Hall.', 'C. the kitchen garden.'], answers: ['A. the library.'], quote: 'Photography is allowed everywhere except in the library', explanation: ['Strong light can damage the old books in the library.', 'Answer: A.'] },
          { prompt: 'Ticket money is mainly used to', options: ['A. pay the guides.', 'B. buy new furniture.', 'C. repair the roof.'], answers: ['C. repair the roof.'], quote: 'pays mainly for repairs to the roof', explanation: ['The money "pays mainly for repairs to the roof".', 'Answer: C.'] },
        ]),
      },
      {
        type: 'matching',
        instruction: 'What can visitors find at each place? Choose FIVE answers from the list, A–F.',
        questions: make(
          [
            { prompt: 'The Great Hall', answers: ['A. live music'], quote: 'a small group plays live music there', explanation: ['On weekend afternoons a group "plays live music there".', 'Answer: A.'] },
            { prompt: 'The kitchen garden', answers: ['B. picnic tables'], quote: "That's the best place for a picnic, and there are tables near the gate.", explanation: ['The garden is "the best place for a picnic" and has tables.', 'Answer: B.'] },
            { prompt: 'The East Tower', answers: ['C. closed this month'], quote: 'the East Tower is closed this month while we repair the stairs', explanation: ['The tower is closed this month for repairs to the stairs.', 'Answer: C.'] },
            { prompt: 'The old stables', answers: ["D. children's games"], quote: "turned into a play area, with children's games", explanation: ['The stables are now a play area with children\'s games.', 'Answer: D.'] },
            { prompt: 'The lake', answers: ['E. shop'], quote: "down by the lake you'll find our shop", explanation: ['"down by the lake you\'ll find our shop".', 'Answer: E. (F, guided talks only, is not used.)'] },
          ],
          PLACES
        ),
      },
    ]
  }

  if (part === 'part3') {
    return [
      {
        type: 'mcq',
        instruction: `${CHOOSE_ABC}`,
        questions: make([
          { prompt: 'Why did Maya and Tom choose this topic?', options: ['A. Their tutor suggested it.', 'B. They noticed more people cycling in town.', 'C. They work for a cycling company.'], answers: ['B. They noticed more people cycling in town.'], quote: 'we noticed that the number of cyclists in town has grown a lot', explanation: ['Maya says they noticed the number of cyclists "has grown a lot".', 'Answer: B.'] },
          { prompt: 'How will they collect most of their information now?', options: ['A. an online survey', 'B. interviews at bike parks', 'C. official council reports'], answers: ['B. interviews at bike parks'], quote: 'So now we\'re planning to interview cyclists face to face at the main bike parks.', explanation: ['Few people answered the online survey, so they will interview cyclists at the bike parks.', 'Answer: B.'] },
          { prompt: 'The most common reason people gave for cycling was that it is', options: ['A. cheaper than other transport.', 'B. good for their health.', 'C. quicker than the bus at busy times.'], answers: ['C. quicker than the bus at busy times.'], quote: "the most common reason was that it's faster than the bus at rush hour", explanation: ['Maya expected "cheaper", but the most common reason was speed at rush hour.', 'Answer: C.'] },
          { prompt: 'What stops many people from cycling?', options: ['A. the weather', 'B. roads that feel unsafe', 'C. the cost of a bike'], answers: ['B. roads that feel unsafe'], quote: 'the roads near the station feel dangerous because there\'s no separate lane', explanation: ['Tom says "Safety, mostly": the roads near the station feel dangerous.', 'Answer: B.'] },
          { prompt: 'Which city will they compare with their own?', options: ['A. Copenhagen', 'B. Amsterdam', 'C. Utrecht'], answers: ['C. Utrecht'], quote: 'so we chose Utrecht', explanation: ['They read about Copenhagen but chose a smaller city: Utrecht.', 'Answer: C.'] },
        ]),
      },
      {
        type: 'completion',
        instruction: `${COMPLETION_ONE_WORD_OR_NUMBER}`,
        questions: make([
          { prompt: 'Finish interviews by the end of the month (about ____ people)', answers: ['60', 'sixty'], quote: "We're aiming for about sixty people.", explanation: ['Tom: "We\'re aiming for about sixty people."', 'Answer: 60.'] },
          { prompt: 'Put the answers into a ____ and make charts', answers: ['spreadsheet'], quote: "Then we'll put the answers into a spreadsheet", explanation: ['Maya: "put the answers into a spreadsheet and make some charts".', 'Answer: spreadsheet.'] },
          { prompt: 'Include a ____ of the bike lanes', answers: ['map'], quote: 'A map of the bike lanes would make your recommendations much clearer.', explanation: ['The tutor suggests "a map of the bike lanes".', 'Answer: map.'] },
          { prompt: "Speak to someone from the council's ____ department", answers: ['transport'], quote: "someone from the council's transport department", explanation: ['Maya wants to speak to the "transport department".', 'Answer: transport.'] },
          { prompt: 'Report deadline: ____ December', answers: ['2', '2nd', 'second', 'the second'], quote: 'the second of December', explanation: ['The deadline is still "the second of December".', 'Answer: 2(nd).'] },
        ]),
      },
    ]
  }

  return [
    {
      type: 'completion',
      instruction: `${COMPLETION_ONE_WORD}`,
      questions: make([
        { prompt: 'Scientists once thought only animals with large ____ needed sleep.', answers: ['brains'], quote: 'only animals with large brains needed sleep', explanation: ['"scientists believed that only animals with large brains needed sleep".', 'Answer: brains.'] },
        { prompt: 'If fruit flies are kept awake, they sleep ____ the next day.', answers: ['longer'], quote: 'they sleep longer the next day', explanation: ['"if they are kept awake, they sleep longer the next day".', 'Answer: longer.'] },
        { prompt: 'A wild giraffe sleeps for less than five hours, often in short periods of a few ____.', answers: ['minutes'], quote: 'often in short periods of a few minutes at a time', explanation: ['Giraffes sleep "in short periods of a few minutes at a time".', 'Answer: minutes.'] },
        { prompt: 'Animals that are often hunted cannot have long periods of ____ sleep.', answers: ['deep'], quote: 'cannot afford long periods of deep sleep', explanation: ['Hunted animals "cannot afford long periods of deep sleep".', 'Answer: deep.'] },
        { prompt: 'Animals that eat ____ spend many hours feeding.', answers: ['grass'], quote: 'Animals that eat grass need to spend many hours feeding', explanation: ['Grass contains little energy, so grass-eaters feed for many hours.', 'Answer: grass.'] },
        { prompt: 'Dolphins sleep with one half of the ____ at a time.', answers: ['brain'], quote: 'they sleep with one half of the brain at a time', explanation: ['Dolphins sleep "with one half of the brain at a time".', 'Answer: brain.'] },
        { prompt: 'Birds at the edge of a group keep one ____ open.', answers: ['eye'], quote: 'keep one eye open, watching for danger', explanation: ['They "keep one eye open, watching for danger".', 'Answer: eye.'] },
        { prompt: 'Migrating birds may take naps lasting only a few ____.', answers: ['seconds'], quote: 'sometimes lasting only a few seconds', explanation: ['Their naps last "only a few seconds".', 'Answer: seconds.'] },
        { prompt: 'One theory: during sleep, fluid removes ____ from the brain.', answers: ['waste'], quote: 'removes waste that builds up during the day', explanation: ['Fluid "removes waste that builds up during the day".', 'Answer: waste.'] },
        { prompt: 'Sleeping rats repeated the brain activity of running through a ____.', answers: ['maze'], quote: 'rats that ran through a maze showed the same pattern of brain activity again while they slept', explanation: ['Rats showed the same activity as when they "ran through a maze".', 'Answer: maze.'] },
      ]),
    },
  ]
}

function section(part) {
  return {
    title: TITLES[part],
    audioUrl: `/listening/${part}.mp3`,
    audioDurationSec: DURATIONS[part],
    transcript: TRANSCRIPTS[part],
    groups: groupsFor(part),
  }
}

const COVERS = { part1: 'night', part2: 'mountains', part3: 'recycling', part4: 'ocean' }

// Four single parts, plus one full test made of the same four parts
export function listeningTests() {
  const parts = ['part1', 'part2', 'part3', 'part4']
  const singles = parts.map((part) => ({
    title: TITLES[part],
    skill: 'listening',
    kind: 'single',
    durationMin: 10,
    coverUrl: `/landing/${COVERS[part]}.jpg`,
    sections: [section(part)],
  }))
  const full = {
    title: 'Listening Practice Test 1',
    skill: 'listening',
    kind: 'full',
    durationMin: 30,
    coverUrl: '/landing/desert.jpg',
    sections: parts.map(section),
  }
  return [full, ...singles]
}
