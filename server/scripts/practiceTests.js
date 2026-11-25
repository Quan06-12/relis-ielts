import { findEvidence } from '../src/utils/evidenceRange.js'

// Single-passage Reading tests for the demo account, one per topic, each with its own cover photo
// (client/public/landing). The passages were written for this project. Every question has
// accepted answers, an explanation and evidence copied exactly from the passage.

const TFNG = ['TRUE', 'FALSE', 'NOT GIVEN']
const TFNG_INSTRUCTION = 'Do the following statements agree with the information given in the passage? Choose TRUE, FALSE or NOT GIVEN.'
const COMPLETION_INSTRUCTION = 'Complete the sentences. Choose ONE WORD ONLY from the passage for each answer.'

// Builds one test from a passage, TRUE/FALSE/NOT GIVEN items and sentence-completion items.
// Each item: { prompt, answers, quote, explanation }; `quote` becomes the evidence.
function singlePassageTest({ title, cover, passage, tfng, completion }) {
  const withEvidence = (items, options) =>
    items.map(({ quote, ...item }) => ({ ...item, options, evidence: findEvidence(passage, quote) }))
  return {
    title,
    skill: 'reading',
    kind: 'single',
    durationMin: 20,
    coverUrl: `/landing/${cover}.jpg`,
    sections: [
      {
        title,
        passage,
        groups: [
          { type: 'tfng', instruction: TFNG_INSTRUCTION, questions: withEvidence(tfng, TFNG) },
          { type: 'completion', instruction: COMPLETION_INSTRUCTION, questions: withEvidence(completion, []) },
        ],
      },
    ],
  }
}

const BEES = `Most people imagine honeybees living in quiet fields far from traffic. In fact, cities can be surprisingly good homes for them. Parks, gardens and balconies contain a wide variety of flowers, and because towns are warmer than the countryside, plants there often bloom earlier and for longer.

Many cities now have rooftop hives looked after by volunteers, restaurants and even hotels. In London alone, the number of registered hives rose sharply in the 2010s. Some beekeepers sell the honey, which often tastes different from street to street because the bees collect nectar from whatever trees grow nearby.

Not everyone welcomes this trend. Ecologists warn that too many honeybees can take food away from wild bees, which are more important for pollinating many native plants. They argue that planting more flowers is more useful than adding more hives.

Pollution was once thought to be a serious danger to city bees. However, studies of urban honey have found very low levels of harmful metals, and colonies in towns are often healthier than those on farms, where they may be exposed to pesticides.`

const LIGHTHOUSE = `The white lighthouse at the end of the harbour wall was built in 1857 after a winter storm wrecked three fishing boats on the rocks below. For more than a century, a keeper and his family lived in the small cottage beside it, climbing the one hundred and twelve steps every evening to light the lamp.

The original light burned oil and could be seen about eighteen kilometres out at sea. In 1923 it was replaced by an electric lamp, and a large glass lens was added to make the beam stronger. The lens, made in France, is still in place today.

Since 1981 the lighthouse has worked automatically, and no keeper lives there any more. The cottage now houses a small museum with old logbooks, uniforms and photographs of the families who served there.

Visitors can climb to the gallery at the top between April and October. Tours run every hour, but children under eight are not allowed on the stairs for safety reasons. On clear days, the view stretches across the bay to the islands in the north.`

const OCEAN = `The oceans already absorb about a quarter of the carbon dioxide that humans release into the air each year. Some of it dissolves directly into sea water, while tiny floating plants called phytoplankton take in carbon as they grow. When these plants die, a small part of them sinks to the deep ocean, where the carbon can remain for centuries.

Scientists are now studying whether this natural process could be increased on purpose. One idea is to add iron to areas of ocean where it is scarce, so that more phytoplankton can grow. Early experiments did produce large blooms of plants, but it was not clear how much carbon actually reached the deep sea.

Another approach is to protect and restore coastal habitats such as mangroves and seagrass meadows. These store carbon in their roots and in the mud beneath them, and they also shelter young fish and reduce damage from storms.

Critics warn that absorbing more carbon makes sea water more acidic, which harms shellfish and coral reefs. They argue that cutting emissions must remain the main solution.`

const NIGHT = `A century ago, almost everyone could see the Milky Way on a clear night. Today, around a third of the world's population, and most people in Europe and North America, live under skies so bright that it is no longer visible.

The main cause is artificial light that shines upwards or sideways instead of down onto streets and buildings. Street lamps, advertising screens and floodlit sports grounds all add to a glow that can be seen from aircraft hundreds of kilometres away.

Light pollution affects more than astronomers. Many birds migrate at night and use the stars to find their way, and bright cities can confuse them. Sea turtles that hatch on beaches move towards the brightest horizon, which should be the sea, but may instead be a coastal road.

Solutions are relatively cheap. Lamps can be shielded so that light only falls where it is needed, and many towns now switch off or dim lights after midnight. Some areas have been named dark sky parks, where strict rules on outdoor lighting help attract visitors who come to watch the stars.`

const MONEY = `For thousands of years, people paid for goods with coins made from gold, silver or copper. Coins were valuable in themselves, but they were heavy, and carrying large amounts over long distances was both difficult and dangerous.

The first paper money appeared in China more than a thousand years ago. Merchants began leaving their heavy coins with trusted traders and receiving written receipts in return. These receipts could be passed from person to person, and by the eleventh century the government had taken control of printing them.

When the traveller Marco Polo visited China in the thirteenth century, he was astonished that people accepted pieces of paper as payment. In Europe, banknotes did not become common until the seventeenth century, when banks in Sweden and England began issuing them.

Today paper money is slowly giving way to card and phone payments. In some countries, fewer than one purchase in ten is now paid in cash, and some shops no longer accept notes at all.`

const DESERT = `The Namib Desert on the coast of south-west Africa receives almost no rain. In some years, not a single shower falls. Yet many plants and animals survive there, thanks to the thick fog that rolls in from the cold Atlantic Ocean on many mornings.

Some plants have leaves covered in tiny grooves that guide drops of fog towards their roots. One famous beetle stands on the tops of sand dunes with its back raised into the wind, so that water collects on its shell and runs down towards its mouth.

Engineers have copied these ideas. In Chile and Morocco, large vertical nets called fog collectors are placed on hillsides. Water drops gather on the mesh and run into pipes, providing drinking water for villages that have no other supply. A single large net can collect several hundred litres on a foggy day.

Fog collectors are cheap and need no electricity, but they only work in places where fog is frequent and the wind blows it towards the nets.`

const RECYCLING = `Every year the world produces more than three hundred million tonnes of plastic, yet less than a tenth of it is recycled. The rest is buried, burned or ends up in the natural environment, where it can take hundreds of years to break down.

One problem is that there are many different types of plastic, and they cannot all be recycled together. Drinks bottles are usually made from a type that is easy to recycle, while yoghurt pots and food wrappers often contain mixtures that are much harder to process.

Contamination is another difficulty. Containers that still contain food or drink can spoil a whole load of recycling, which is why councils ask people to rinse them first. In some cities, machines that pay a small deposit for every bottle returned have raised collection rates to over ninety per cent.

Many experts believe that recycling alone cannot solve the problem. They argue that the best solution is to use less plastic in the first place, for example by choosing refillable bottles and buying food without packaging.`

const ART = `Modern art galleries often surprise first-time visitors. Instead of quiet rooms filled with old paintings in golden frames, they may find huge sculptures, video screens, or even an empty room in which the light itself is the artwork.

Many galleries now try to make modern art easier to understand. Labels are written in plain language, and free guided tours explain what the artists were trying to achieve. Some museums offer apps that play short recordings when visitors stand in front of a particular work.

Children are an important audience. Galleries run weekend workshops where young visitors can create their own pieces, and some have quiet rooms for families who need a break from the crowds.

Entry to permanent collections is free at many public galleries, although special exhibitions usually charge a fee. Visitors are generally allowed to take photographs, but the use of flash is banned because strong light can damage delicate materials over time.`

export function practiceTests() {
  return [
    singlePassageTest({
      title: 'The Secret Life of Urban Bees',
      cover: 'bees',
      passage: BEES,
      tfng: [
        { prompt: 'Flowers in towns often bloom earlier than in the countryside.', answers: ['TRUE'], quote: 'plants there often bloom earlier and for longer', explanation: ['Because towns are warmer, plants there "often bloom earlier and for longer".', 'The statement agrees with the passage: TRUE.'] },
        { prompt: 'Only volunteers keep hives on city rooftops.', answers: ['FALSE'], quote: 'looked after by volunteers, restaurants and even hotels', explanation: ['Hives are looked after by volunteers, restaurants and hotels.', '"Only volunteers" contradicts this: FALSE.'] },
        { prompt: 'Urban honey sells for a higher price than farm honey.', answers: ['NOT GIVEN'], quote: 'Some beekeepers sell the honey', explanation: ['The passage says some beekeepers sell honey, but says nothing about its price.', 'NOT GIVEN.'] },
        { prompt: 'Some ecologists believe planting flowers helps more than adding hives.', answers: ['TRUE'], quote: 'planting more flowers is more useful than adding more hives', explanation: ['Ecologists argue planting flowers "is more useful than adding more hives".', 'TRUE.'] },
      ],
      completion: [
        { prompt: 'Too many honeybees can take food from ______ bees.', answers: ['wild'], quote: 'can take food away from wild bees', explanation: ['Ecologists warn honeybees can take food away from "wild bees".', 'Answer: wild.'] },
        { prompt: 'Bees on farms may be harmed by ______.', answers: ['pesticides'], quote: 'they may be exposed to pesticides', explanation: ['Farm colonies "may be exposed to pesticides".', 'Answer: pesticides.'] },
      ],
    }),
    singlePassageTest({
      title: 'A Guide to the Harbour Lighthouse',
      cover: 'lighthouse',
      passage: LIGHTHOUSE,
      tfng: [
        { prompt: 'The lighthouse was built after boats were wrecked on the rocks.', answers: ['TRUE'], quote: 'built in 1857 after a winter storm wrecked three fishing boats', explanation: ['It was built "after a winter storm wrecked three fishing boats".', 'TRUE.'] },
        { prompt: 'The French glass lens has since been replaced.', answers: ['FALSE'], quote: 'The lens, made in France, is still in place today.', explanation: ['The lens "is still in place today".', 'Saying it was replaced contradicts the passage: FALSE.'] },
        { prompt: 'A keeper still lives in the cottage beside the lighthouse.', answers: ['FALSE'], quote: 'no keeper lives there any more', explanation: ['Since 1981 the light is automatic and "no keeper lives there any more".', 'FALSE.'] },
        { prompt: 'The museum shop sells copies of the old logbooks.', answers: ['NOT GIVEN'], quote: 'a small museum with old logbooks, uniforms and photographs', explanation: ['The museum displays logbooks, but no shop is mentioned.', 'NOT GIVEN.'] },
      ],
      completion: [
        { prompt: 'The oil lamp could be seen about ______ kilometres out at sea.', answers: ['eighteen', '18'], quote: 'could be seen about eighteen kilometres out at sea', explanation: ['The oil light "could be seen about eighteen kilometres out at sea".', 'Answer: eighteen (18).'] },
        { prompt: 'Children under ______ cannot climb the stairs.', answers: ['eight', '8'], quote: 'children under eight are not allowed on the stairs', explanation: ['"Children under eight are not allowed on the stairs".', 'Answer: eight (8).'] },
      ],
    }),
    singlePassageTest({
      title: 'Can Oceans Store Our Carbon?',
      cover: 'ocean',
      passage: OCEAN,
      tfng: [
        { prompt: 'The oceans absorb about a quarter of the carbon dioxide humans release.', answers: ['TRUE'], quote: 'absorb about a quarter of the carbon dioxide that humans release', explanation: ['The oceans "absorb about a quarter of the carbon dioxide that humans release".', 'TRUE.'] },
        { prompt: 'Iron experiments clearly showed how much carbon reached the deep sea.', answers: ['FALSE'], quote: 'it was not clear how much carbon actually reached the deep sea', explanation: ['"It was not clear how much carbon actually reached the deep sea".', 'FALSE.'] },
        { prompt: 'Mangroves are more effective than seagrass at storing carbon.', answers: ['NOT GIVEN'], quote: 'such as mangroves and seagrass meadows', explanation: ['Both are mentioned, but they are not compared.', 'NOT GIVEN.'] },
        { prompt: 'Coastal habitats also help to protect young fish.', answers: ['TRUE'], quote: 'they also shelter young fish', explanation: ['These habitats "also shelter young fish".', 'TRUE.'] },
      ],
      completion: [
        { prompt: 'Tiny floating plants are called ______.', answers: ['phytoplankton'], quote: 'tiny floating plants called phytoplankton', explanation: ['"Tiny floating plants called phytoplankton".', 'Answer: phytoplankton.'] },
        { prompt: 'More absorbed carbon makes sea water more ______.', answers: ['acidic'], quote: 'makes sea water more acidic', explanation: ['Absorbing more carbon "makes sea water more acidic".', 'Answer: acidic.'] },
      ],
    }),
    singlePassageTest({
      title: 'Night Skies and Light Pollution',
      cover: 'night',
      passage: NIGHT,
      tfng: [
        { prompt: 'Most people in Europe can no longer see the Milky Way.', answers: ['TRUE'], quote: 'most people in Europe and North America, live under skies so bright that it is no longer visible', explanation: ['Most people in Europe live under skies where it "is no longer visible".', 'TRUE.'] },
        { prompt: 'Light that shines downwards is the main cause of the problem.', answers: ['FALSE'], quote: 'artificial light that shines upwards or sideways instead of down', explanation: ['The main cause is light that shines "upwards or sideways instead of down".', 'FALSE.'] },
        { prompt: 'Some migrating birds use the stars to navigate.', answers: ['TRUE'], quote: 'use the stars to find their way', explanation: ['Many birds migrate at night and "use the stars to find their way".', 'TRUE.'] },
        { prompt: 'Dark sky parks charge visitors an entrance fee.', answers: ['NOT GIVEN'], quote: 'help attract visitors who come to watch the stars', explanation: ['Dark sky parks attract visitors, but no fee is mentioned.', 'NOT GIVEN.'] },
      ],
      completion: [
        { prompt: 'Young sea ______ may move towards a coastal road.', answers: ['turtles'], quote: 'Sea turtles that hatch on beaches', explanation: ['"Sea turtles that hatch on beaches" move towards the brightest horizon.', 'Answer: turtles.'] },
        { prompt: 'Many towns dim lights after ______.', answers: ['midnight'], quote: 'switch off or dim lights after midnight', explanation: ['Towns "switch off or dim lights after midnight".', 'Answer: midnight.'] },
      ],
    }),
    singlePassageTest({
      title: 'The History of Paper Money',
      cover: 'coins',
      passage: MONEY,
      tfng: [
        { prompt: 'Carrying many coins over long distances could be dangerous.', answers: ['TRUE'], quote: 'carrying large amounts over long distances was both difficult and dangerous', explanation: ['Carrying large amounts "was both difficult and dangerous".', 'TRUE.'] },
        { prompt: 'Paper money was first used in Europe.', answers: ['FALSE'], quote: 'The first paper money appeared in China', explanation: ['"The first paper money appeared in China".', 'FALSE.'] },
        { prompt: 'Marco Polo brought Chinese banknotes back to Italy.', answers: ['NOT GIVEN'], quote: 'he was astonished that people accepted pieces of paper as payment', explanation: ['The passage only says he was astonished; nothing about bringing notes home.', 'NOT GIVEN.'] },
        { prompt: 'Some shops no longer accept banknotes.', answers: ['TRUE'], quote: 'some shops no longer accept notes at all', explanation: ['"Some shops no longer accept notes at all".', 'TRUE.'] },
      ],
      completion: [
        { prompt: 'Merchants received written ______ for their coins.', answers: ['receipts'], quote: 'receiving written receipts in return', explanation: ['Merchants left coins and received "written receipts in return".', 'Answer: receipts.'] },
        { prompt: 'Banks in England and ______ issued early European banknotes.', answers: ['Sweden'], quote: 'banks in Sweden and England began issuing them', explanation: ['"Banks in Sweden and England began issuing them".', 'Answer: Sweden.'] },
      ],
    }),
    singlePassageTest({
      title: 'Desert Plants That Drink Fog',
      cover: 'desert',
      passage: DESERT,
      tfng: [
        { prompt: 'In some years no rain at all falls in the Namib Desert.', answers: ['TRUE'], quote: 'In some years, not a single shower falls.', explanation: ['"In some years, not a single shower falls".', 'TRUE.'] },
        { prompt: 'The fog comes from a warm ocean.', answers: ['FALSE'], quote: 'the thick fog that rolls in from the cold Atlantic Ocean', explanation: ['The fog rolls in "from the cold Atlantic Ocean".', 'FALSE.'] },
        { prompt: 'Fog collectors are used in Chile.', answers: ['TRUE'], quote: 'In Chile and Morocco, large vertical nets called fog collectors', explanation: ['Fog collectors are placed on hillsides "In Chile and Morocco".', 'TRUE.'] },
        { prompt: 'Fog collectors are more expensive than wells.', answers: ['NOT GIVEN'], quote: 'Fog collectors are cheap and need no electricity', explanation: ['They are called cheap, but are not compared with wells.', 'NOT GIVEN.'] },
      ],
      completion: [
        { prompt: 'A beetle collects water on its ______.', answers: ['shell'], quote: 'water collects on its shell', explanation: ['"Water collects on its shell and runs down towards its mouth".', 'Answer: shell.'] },
        { prompt: 'Fog collectors do not need ______.', answers: ['electricity'], quote: 'need no electricity', explanation: ['Fog collectors "need no electricity".', 'Answer: electricity.'] },
      ],
    }),
    singlePassageTest({
      title: 'A Group Project on Recycling',
      cover: 'recycling',
      passage: RECYCLING,
      tfng: [
        { prompt: 'Less than ten per cent of plastic is recycled.', answers: ['TRUE'], quote: 'less than a tenth of it is recycled', explanation: ['"Less than a tenth of it is recycled".', 'TRUE.'] },
        { prompt: 'All types of plastic can be recycled together.', answers: ['FALSE'], quote: 'they cannot all be recycled together', explanation: ['Different plastics "cannot all be recycled together".', 'FALSE.'] },
        { prompt: 'Yoghurt pots are easier to recycle than drinks bottles.', answers: ['FALSE'], quote: 'yoghurt pots and food wrappers often contain mixtures that are much harder to process', explanation: ['Bottles are easy to recycle; yoghurt pots are "much harder to process".', 'FALSE.'] },
        { prompt: 'Deposit machines are used in every European city.', answers: ['NOT GIVEN'], quote: 'In some cities, machines that pay a small deposit', explanation: ['Only "some cities" are mentioned; nothing about every European city.', 'NOT GIVEN.'] },
      ],
      completion: [
        { prompt: 'Councils ask people to ______ containers before recycling them.', answers: ['rinse'], quote: 'ask people to rinse them first', explanation: ['Councils "ask people to rinse them first".', 'Answer: rinse.'] },
        { prompt: 'Experts suggest choosing ______ bottles.', answers: ['refillable'], quote: 'choosing refillable bottles', explanation: ['For example "by choosing refillable bottles".', 'Answer: refillable.'] },
      ],
    }),
    singlePassageTest({
      title: 'A Day at the Modern Art Gallery',
      cover: 'art',
      passage: ART,
      tfng: [
        { prompt: 'Modern galleries may show video screens as artworks.', answers: ['TRUE'], quote: 'huge sculptures, video screens', explanation: ['Visitors may find "huge sculptures, video screens".', 'TRUE.'] },
        { prompt: 'Guided tours in many galleries are free.', answers: ['TRUE'], quote: 'free guided tours explain what the artists were trying to achieve', explanation: ['"Free guided tours explain what the artists were trying to achieve".', 'TRUE.'] },
        { prompt: 'Weekend workshops are only for adults.', answers: ['FALSE'], quote: 'weekend workshops where young visitors can create their own pieces', explanation: ['Workshops are where "young visitors can create their own pieces".', 'FALSE.'] },
        { prompt: 'Most visitors prefer the apps to the guided tours.', answers: ['NOT GIVEN'], quote: 'Some museums offer apps that play short recordings', explanation: ['Apps and tours are both mentioned, but visitors’ preferences are not.', 'NOT GIVEN.'] },
      ],
      completion: [
        { prompt: 'Special ______ usually charge an entry fee.', answers: ['exhibitions'], quote: 'special exhibitions usually charge a fee', explanation: ['"Special exhibitions usually charge a fee".', 'Answer: exhibitions.'] },
        { prompt: 'Using ______ is banned when taking photographs.', answers: ['flash'], quote: 'the use of flash is banned', explanation: ['"The use of flash is banned because strong light can damage delicate materials".', 'Answer: flash.'] },
      ],
    }),
  ]
}
