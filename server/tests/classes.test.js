import { test, before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { startTestDatabase, clearTestDatabase, stopTestDatabase } from './helpers/database.js'
import { fakeVerifyGoogleCredential, createSignedInUser } from './helpers/auth.js'
import { sampleSections } from './helpers/sampleTest.js'

const app = createApp({ verifyGoogleCredential: fakeVerifyGoogleCredential })

before(startTestDatabase)
beforeEach(clearTestDatabase)
after(stopTestDatabase)

// A teacher with one class and one published test, and a student who is not in the class yet
async function setUp() {
  const teacher = await createSignedInUser('teacher')
  const student = await createSignedInUser('student')

  const created = await request(app).post('/api/classes').set('Authorization', teacher.authHeader).send({ name: 'IELTS 6.5', color: 'blue' })
  const testId = await createPublishedTest(teacher.authHeader)

  return { teacher, student, classInfo: created.body.class, testId }
}

async function createPublishedTest(authHeader, { publish = true } = {}) {
  const created = await request(app).post('/api/tests').set('Authorization', authHeader).send({ title: 'Cam 18 Test 1', skill: 'reading', kind: 'full' })
  const testId = created.body.test.id
  await request(app).put(`/api/tests/${testId}`).set('Authorization', authHeader).send({ title: 'Cam 18 Test 1', sections: sampleSections() })
  if (publish) {
    await request(app).patch(`/api/tests/${testId}/status`).set('Authorization', authHeader).send({ status: 'published' })
  }
  return testId
}

function join(user, code) {
  return request(app).post('/api/classes/join').set('Authorization', user.authHeader).send({ code })
}

test('US04: creating a class makes me its teacher and gives a 6-character code', async () => {
  const { classInfo } = await setUp()

  assert.equal(classInfo.myRole, 'teacher')
  assert.equal(classInfo.color, 'blue')
  assert.match(classInfo.code, /^[A-HJ-NP-Z2-9]{6}$/)
})

test('US04: a class needs a name', async () => {
  const { authHeader } = await createSignedInUser()

  const response = await request(app).post('/api/classes').set('Authorization', authHeader).send({ name: '  ' })

  assert.equal(response.status, 400)
  assert.equal(response.body.error.code, 'VALIDATION_ERROR')
})

test('US06: a student joins with the code, typed in lower case with spaces', async () => {
  const { student, classInfo } = await setUp()

  const response = await join(student, ` ${classInfo.code.toLowerCase()} `)

  assert.equal(response.status, 201)
  assert.equal(response.body.class.myRole, 'student')
  assert.equal(response.body.class.code, null)
})

test('US06: joining twice returns 409 ALREADY_MEMBER, a wrong code returns 404', async () => {
  const { student, classInfo } = await setUp()
  await join(student, classInfo.code)

  const again = await join(student, classInfo.code)
  const wrong = await join(student, 'ZZZZZZ')

  assert.equal(again.status, 409)
  assert.equal(again.body.error.code, 'ALREADY_MEMBER')
  assert.equal(wrong.status, 404)
})

test('US07: my classes are split by role, students see the teacher name', async () => {
  const { teacher, student, classInfo } = await setUp()
  await join(student, classInfo.code)

  const teaching = await request(app).get('/api/classes?role=teacher').set('Authorization', teacher.authHeader)
  const studying = await request(app).get('/api/classes?role=student').set('Authorization', student.authHeader)

  assert.equal(teaching.body.items.length, 1)
  assert.equal(teaching.body.items[0].studentCount, 1)
  assert.equal(teaching.body.items[0].openAssignmentCount, 0)
  assert.equal(studying.body.items[0].assignmentCount, 0)
  assert.equal(studying.body.items[0].nextDue, null)
  assert.equal(studying.body.items[0].teacherName, 'teacher')
  assert.equal(studying.body.items[0].code, null)
})

test('US05: only the teacher sees the code; strangers get 404', async () => {
  const { teacher, student, classInfo } = await setUp()
  const stranger = await createSignedInUser('stranger')
  await join(student, classInfo.code)

  const asTeacher = await request(app).get(`/api/classes/${classInfo.id}`).set('Authorization', teacher.authHeader)
  const asStudent = await request(app).get(`/api/classes/${classInfo.id}`).set('Authorization', student.authHeader)
  const asStranger = await request(app).get(`/api/classes/${classInfo.id}`).set('Authorization', stranger.authHeader)

  assert.equal(asTeacher.body.class.code, classInfo.code)
  assert.equal(asStudent.body.class.code, null)
  assert.equal(asStranger.status, 404)
})

test('US21: the teacher adds a published test once; adding it again changes nothing', async () => {
  const { teacher, classInfo, testId } = await setUp()

  const first = await request(app).post(`/api/classes/${classInfo.id}/library`).set('Authorization', teacher.authHeader).send({ testIds: [testId] })
  const second = await request(app).post(`/api/classes/${classInfo.id}/library`).set('Authorization', teacher.authHeader).send({ testIds: [testId] })
  const library = await request(app).get(`/api/classes/${classInfo.id}/library`).set('Authorization', teacher.authHeader)

  assert.equal(first.body.added, 1)
  assert.equal(second.body.added, 0)
  assert.equal(library.body.items.length, 1)
})

test('US21: a draft test cannot go into a class', async () => {
  const { teacher, classInfo } = await setUp()
  const draftId = await createPublishedTest(teacher.authHeader, { publish: false })

  const response = await request(app).post(`/api/classes/${classInfo.id}/library`).set('Authorization', teacher.authHeader).send({ testIds: [draftId] })

  assert.equal(response.status, 400)
})

test('US21: students cannot change the class library or open the gradebook', async () => {
  const { student, classInfo, testId } = await setUp()
  await join(student, classInfo.code)

  const add = await request(app).post(`/api/classes/${classInfo.id}/library`).set('Authorization', student.authHeader).send({ testIds: [testId] })
  const gradebook = await request(app).get(`/api/classes/${classInfo.id}/gradebook`).set('Authorization', student.authHeader)

  assert.equal(add.status, 404)
  assert.equal(gradebook.status, 404)
})

test('US22, US40: a student takes a class test and it appears in the gradebook', async () => {
  const { teacher, student, classInfo, testId } = await setUp()
  await join(student, classInfo.code)
  await request(app).post(`/api/classes/${classInfo.id}/library`).set('Authorization', teacher.authHeader).send({ testIds: [testId] })

  const started = await request(app)
    .post('/api/attempts')
    .set('Authorization', student.authHeader)
    .send({ testId, classId: classInfo.id, mode: { type: 'full', sectionIndexes: [0, 1], timeLimitMin: 60 } })
  await request(app).post(`/api/attempts/${started.body.attempt.id}/submit`).set('Authorization', student.authHeader)

  const gradebook = await request(app).get(`/api/classes/${classInfo.id}/gradebook`).set('Authorization', teacher.authHeader)

  assert.equal(started.status, 201)
  assert.equal(gradebook.body.tests[0].id, testId)
  assert.equal(gradebook.body.rows[0].student.name, 'student')
  assert.equal(gradebook.body.rows[0].cells[0].attemptId, started.body.attempt.id)
})

test('US22: a test outside my classes cannot be started with a classId', async () => {
  const { student, classInfo, testId } = await setUp()
  await join(student, classInfo.code) // in the class, but the test was never added to it

  const response = await request(app)
    .post('/api/attempts')
    .set('Authorization', student.authHeader)
    .send({ testId, classId: classInfo.id, mode: { type: 'full', sectionIndexes: [0, 1], timeLimitMin: 60 } })

  assert.equal(response.status, 404)
})

test('US21: removing a test from the class library', async () => {
  const { teacher, classInfo, testId } = await setUp()
  await request(app).post(`/api/classes/${classInfo.id}/library`).set('Authorization', teacher.authHeader).send({ testIds: [testId] })

  const removed = await request(app).delete(`/api/classes/${classInfo.id}/library/${testId}`).set('Authorization', teacher.authHeader)
  const library = await request(app).get(`/api/classes/${classInfo.id}/library`).set('Authorization', teacher.authHeader)

  assert.equal(removed.status, 204)
  assert.equal(library.body.items.length, 0)
})

test('US09: the teacher removes a student; the student loses access but keeps their attempts', async () => {
  const { teacher, student, classInfo, testId } = await setUp()
  await join(student, classInfo.code)
  await request(app).post(`/api/classes/${classInfo.id}/library`).set('Authorization', teacher.authHeader).send({ testIds: [testId] })
  const started = await request(app)
    .post('/api/attempts')
    .set('Authorization', student.authHeader)
    .send({ testId, classId: classInfo.id, mode: { type: 'full', sectionIndexes: [0, 1], timeLimitMin: 60 } })
  await request(app).post(`/api/attempts/${started.body.attempt.id}/submit`).set('Authorization', student.authHeader)

  const removed = await request(app).delete(`/api/classes/${classInfo.id}/members/${student.user.id}`).set('Authorization', teacher.authHeader)
  const classPage = await request(app).get(`/api/classes/${classInfo.id}`).set('Authorization', student.authHeader)
  const history = await request(app).get('/api/attempts').set('Authorization', student.authHeader)

  assert.equal(removed.status, 204)
  assert.equal(classPage.status, 404)
  assert.equal(history.body.total, 1)
})

test('US09: the teacher cannot be removed and students cannot remove anyone', async () => {
  const { teacher, student, classInfo } = await setUp()
  await join(student, classInfo.code)

  const removeTeacher = await request(app).delete(`/api/classes/${classInfo.id}/members/${teacher.user.id}`).set('Authorization', teacher.authHeader)
  const byStudent = await request(app).delete(`/api/classes/${classInfo.id}/members/${student.user.id}`).set('Authorization', student.authHeader)

  assert.equal(removeTeacher.status, 404)
  assert.equal(byStudent.status, 404)
})

test('US10: a student leaves and needs the code to come back; the teacher cannot leave', async () => {
  const { teacher, student, classInfo } = await setUp()
  await join(student, classInfo.code)

  const left = await request(app).delete(`/api/classes/${classInfo.id}/membership`).set('Authorization', student.authHeader)
  const myClasses = await request(app).get('/api/classes').set('Authorization', student.authHeader)
  const rejoined = await join(student, classInfo.code)
  const teacherLeaves = await request(app).delete(`/api/classes/${classInfo.id}/membership`).set('Authorization', teacher.authHeader)

  assert.equal(left.status, 204)
  assert.equal(myClasses.body.items.length, 0)
  assert.equal(rejoined.status, 201)
  assert.equal(teacherLeaves.status, 409)
  assert.equal(teacherLeaves.body.error.code, 'TEACHER_CANNOT_LEAVE')
})

test('Leaderboard: members see every student of the class this week; outsiders get 404', async () => {
  const { teacher, student, classInfo } = await setUp()
  await join(student, classInfo.code)
  const outsider = await createSignedInUser('outsider')

  const forStudent = await request(app).get(`/api/classes/${classInfo.id}/leaderboard`).set('Authorization', student.authHeader)
  const forOutsider = await request(app).get(`/api/classes/${classInfo.id}/leaderboard`).set('Authorization', outsider.authHeader)
  const forTeacher = await request(app).get(`/api/classes/${classInfo.id}/leaderboard`).set('Authorization', teacher.authHeader)

  assert.equal(forStudent.status, 200)
  assert.deepEqual(
    forStudent.body.items.map((row) => [row.name, row.rank, row.count, row.change]),
    [['student', 1, 0, null]],
  )
  assert.equal(forTeacher.status, 200)
  assert.equal(forOutsider.status, 404)
})
