// Fills the database with demo data for the class presentation.
//
//   npm run seed:demo -- your.email@gmail.com
//
// The email must belong to an account that has signed in to the web at least once.
// Running it again first removes the previous demo data, so it can be repeated safely.
// Names shown in the app look real (no "demo"), so the data is found again by its exact names
// (DEMO_TEST_TITLES, CLASS_NAME, VOCAB_SET_NAME) and the fake students by their googleId prefix.
// Older runs used a "[Demo]" prefix and "demo-student-" ids; those are removed too.

import mongoose from 'mongoose'
import { connectDatabase } from '../src/config/db.js'
import { User } from '../src/models/User.js'
import { Test } from '../src/models/Test.js'
import { Attempt } from '../src/models/Attempt.js'
import { Class } from '../src/models/Class.js'
import { ClassMember } from '../src/models/ClassMember.js'
import { ClassLibraryItem } from '../src/models/ClassLibraryItem.js'
import { Assignment } from '../src/models/Assignment.js'
import { VocabSet } from '../src/models/VocabSet.js'
import { renumberQuestions, listQuestions } from '../src/utils/testContent.js'
import { gradeAttempt } from '../src/utils/grading.js'
import { generateClassCode } from '../src/utils/classCode.js'
import { demoReadingTest, demoShortTest } from './demoData.js'
import { practiceTests } from './practiceTests.js'

const DAY = 24 * 60 * 60 * 1000
const daysAgo = (days) => new Date(Date.now() - days * DAY)

// Fake students for the gradebook, and how many of the 40 questions each one gets right
const STUDENTS = [
  { name: 'Nguyễn Minh Anh', correct: 26 },
  { name: 'Trần Gia Bảo', correct: 31 },
  { name: 'Lê Thu Hà', correct: 35 },
]

const CLASS_NAME = 'Lớp IELTS 6.5 · Tối 2-4-6'
const VOCAB_SET_NAME = 'Environment & Climate'
const DEMO_TEST_TITLES = [demoReadingTest(), demoShortTest(), ...practiceTests()].map((test) => test.title)
const STUDENT_ID_PREFIX = 'seed-student-'
const OLD_PREFIX = /^\[Demo\]/ // names used by earlier versions of this script

// Words of the demo vocabulary set (US47, US48)
const DEMO_WORDS = [
  { type: 'adj', term: 'sustainable', meaning: 'bền vững', note: 'Hay gặp trong Reading về đô thị, năng lượng', collocations: 'sustainable development, sustainable growth', example: 'Rooftop gardens are a sustainable way to cool city buildings.' },
  { type: 'v', term: 'mitigate', meaning: 'giảm nhẹ, làm dịu bớt', note: 'Đồng nghĩa: reduce, alleviate', verbForms: 'mitigated – mitigated', collocations: 'mitigate the effects of' },
  { type: 'n', term: 'biodiversity', meaning: 'đa dạng sinh học' },
  { type: 'n', term: 'emission', meaning: 'sự thải ra, khí thải', note: 'Thường ở dạng số nhiều: emissions' },
  { type: 'phr', term: 'run off', meaning: 'chảy tràn (nước mưa)', note: 'Danh từ: runoff' },
]

async function main() {
  const email = process.argv[2]
  if (!email) {
    throw new Error('Usage: npm run seed:demo -- your.email@gmail.com')
  }

  await connectDatabase(process.env.MONGODB_URI)

  const teacher = await User.findOne({ email: email.toLowerCase() })
  if (!teacher) {
    throw new Error(`No account with email ${email}. Sign in to the web once, then run this again.`)
  }

  await removeOldDemoData(teacher)

  const fullTest = await createPublishedTest(teacher, demoReadingTest())
  const miniTest = await createPublishedTest(teacher, demoShortTest())
  // One short test per topic, each with its own cover photo, so the library looks full
  const topicTests = []
  for (const content of practiceTests()) {
    topicTests.push(await createPublishedTest(teacher, content))
  }

  // The teacher's own practice, so Home and History are not empty
  await createSubmittedAttempt({ user: teacher, test: fullTest, correctCount: 30, finishedDaysAgo: 2 })

  // A class with three students, both tests in its library, and one assignment
  const demoClass = await createClassWithUniqueCode({
    name: CLASS_NAME,
    description: 'Luyện Reading tối thứ 2, 4, 6',
    color: 'blue',
    createdBy: teacher._id,
  })
  await ClassMember.create({ classId: demoClass._id, userId: teacher._id, role: 'teacher', joinedAt: daysAgo(6) })
  for (const test of [fullTest, miniTest, ...topicTests.slice(0, 3)]) {
    await ClassLibraryItem.create({ classId: demoClass._id, testId: test._id, addedBy: teacher._id, addedAt: daysAgo(5) })
  }
  const assignment = await Assignment.create({
    classId: demoClass._id,
    testId: miniTest._id,
    assignedBy: teacher._id,
    deadline: new Date(Date.now() + 3 * DAY),
    allowLate: true,
  })

  for (const [index, student] of STUDENTS.entries()) {
    const user = await User.create({
      googleId: `${STUDENT_ID_PREFIX}${index + 1}`,
      email: `hocvien${index + 1}@example.com`,
      name: student.name,
    })
    await ClassMember.create({ classId: demoClass._id, userId: user._id, role: 'student', joinedAt: daysAgo(5) })
    await createSubmittedAttempt({ user, test: fullTest, correctCount: student.correct, finishedDaysAgo: 3 - index, classId: demoClass._id })
  }

  // The first student has already done the homework, the others have not
  const firstStudent = await User.findOne({ googleId: `${STUDENT_ID_PREFIX}1` })
  await createSubmittedAttempt({
    user: firstStudent,
    test: miniTest,
    correctCount: 10,
    finishedDaysAgo: 1,
    classId: demoClass._id,
    assignmentId: assignment._id,
  })

  // A vocabulary set, so the "Từ vựng" page has something to show
  await VocabSet.create({ ownerId: teacher._id, name: VOCAB_SET_NAME, color: 'green', words: DEMO_WORDS })

  console.log('Demo data ready:')
  console.log(`  Tests: "${fullTest.title}" (40 questions), "${miniTest.title}" and ${topicTests.length} topic tests, all with covers`)
  console.log(`  Class: "${demoClass.name}", code ${demoClass.code}, ${STUDENTS.length} students, 1 assignment`)
  console.log(`  Vocabulary: "${VOCAB_SET_NAME}" (${DEMO_WORDS.length} words)`)
}

// Removes what an earlier run created for this teacher, and every fake student
async function removeOldDemoData(teacher) {
  const oldTests = await Test.find({ ownerId: teacher._id, $or: [{ title: { $in: DEMO_TEST_TITLES } }, { title: OLD_PREFIX }] }).select('_id')
  const oldClasses = await Class.find({ createdBy: teacher._id, $or: [{ name: CLASS_NAME }, { name: OLD_PREFIX }] }).select('_id')
  const fakeStudents = await User.find({ googleId: /^(seed|demo)-student-/ }).select('_id')

  const testIds = oldTests.map((test) => test._id)
  const classIds = oldClasses.map((item) => item._id)

  await Attempt.deleteMany({ $or: [{ testId: { $in: testIds } }, { userId: { $in: fakeStudents.map((user) => user._id) } }] })
  await Promise.all([
    ClassMember.deleteMany({ classId: { $in: classIds } }),
    ClassLibraryItem.deleteMany({ $or: [{ classId: { $in: classIds } }, { testId: { $in: testIds } }] }),
    Assignment.deleteMany({ $or: [{ classId: { $in: classIds } }, { testId: { $in: testIds } }] }),
  ])
  await Promise.all([
    VocabSet.deleteMany({ ownerId: teacher._id, $or: [{ name: VOCAB_SET_NAME }, { name: OLD_PREFIX }] }),
    Test.deleteMany({ _id: { $in: testIds } }),
    Class.deleteMany({ _id: { $in: classIds } }),
    User.deleteMany({ googleId: /^(seed|demo)-student-/ }),
  ])
}

async function createPublishedTest(teacher, content) {
  const test = new Test({ ...content, ownerId: teacher._id, status: 'published' })
  test.questionCount = renumberQuestions(test.sections)
  await test.save()
  return test
}

async function createClassWithUniqueCode(fields) {
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      return await Class.create({ ...fields, code: generateClassCode() })
    } catch (error) {
      if (error.code !== 11000 || attempt === 5) throw error
    }
  }
}

// A submitted attempt where the first `correctCount` questions are right and the rest are wrong,
// scored with the same function the server uses when a real student submits
async function createSubmittedAttempt({ user, test, correctCount, finishedDaysAgo, classId = null, assignmentId = null }) {
  const sectionIndexes = test.sections.map((_, index) => index)
  const mode = { type: test.kind === 'full' ? 'full' : 'parts', sectionIndexes, timeLimitMin: test.durationMin }

  const answers = listQuestions(test.sections).map((question, index) => ({
    questionId: question._id,
    value: index < correctCount ? [question.answers[0]] : [wrongAnswerFor(question)],
  }))
  const graded = gradeAttempt(test, answers, mode)

  const submittedAt = daysAgo(finishedDaysAgo)
  return Attempt.create({
    userId: user._id,
    testId: test._id,
    classId,
    assignmentId,
    mode,
    status: 'submitted',
    answers: graded.answers,
    result: graded.result,
    startedAt: new Date(submittedAt.getTime() - (test.durationMin - 5) * 60 * 1000),
    submittedAt,
  })
}

// Any option that is not accepted, or a made-up word for typed answers
function wrongAnswerFor(question) {
  return question.options.find((option) => !question.answers.includes(option)) ?? 'unknown'
}

main()
  .catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
  .finally(() => mongoose.disconnect())
