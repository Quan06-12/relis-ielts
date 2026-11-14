import { test, before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { Assignment } from '../src/models/Assignment.js'
import { startTestDatabase, clearTestDatabase, stopTestDatabase } from './helpers/database.js'
import { fakeVerifyGoogleCredential, createSignedInUser } from './helpers/auth.js'
import { sampleSections } from './helpers/sampleTest.js'

const app = createApp({ verifyGoogleCredential: fakeVerifyGoogleCredential })

before(startTestDatabase)
beforeEach(clearTestDatabase)
after(stopTestDatabase)

const fullMode = { type: 'full', sectionIndexes: [0, 1], timeLimitMin: 60 }
const tomorrow = () => new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
const yesterday = () => new Date(Date.now() - 24 * 60 * 60 * 1000)

// A teacher with a class and a published test, and a student already in the class
async function setUp() {
  const teacher = await createSignedInUser('teacher')
  const student = await createSignedInUser('student')

  const created = await request(app).post('/api/tests').set('Authorization', teacher.authHeader).send({ title: 'Homework test', skill: 'reading', kind: 'full' })
  const testId = created.body.test.id
  await request(app).put(`/api/tests/${testId}`).set('Authorization', teacher.authHeader).send({ title: 'Homework test', sections: sampleSections() })
  await request(app).patch(`/api/tests/${testId}/status`).set('Authorization', teacher.authHeader).send({ status: 'published' })

  const newClass = await request(app).post('/api/classes').set('Authorization', teacher.authHeader).send({ name: 'Class A' })
  const classId = newClass.body.class.id
  await request(app).post('/api/classes/join').set('Authorization', student.authHeader).send({ code: newClass.body.class.code })

  return { teacher, student, testId, classId }
}

function assign(teacher, classId, body) {
  return request(app).post(`/api/classes/${classId}/assignments`).set('Authorization', teacher.authHeader).send(body)
}

function listFor(user, classId) {
  return request(app).get(`/api/classes/${classId}/assignments`).set('Authorization', user.authHeader)
}

test('US44: the teacher assigns a test with a deadline; it also lands in the class library', async () => {
  const { teacher, testId, classId } = await setUp()

  const response = await assign(teacher, classId, { testId, deadline: tomorrow() })
  const library = await request(app).get(`/api/classes/${classId}/library`).set('Authorization', teacher.authHeader)

  assert.equal(response.status, 201)
  assert.equal(response.body.assignment.test.id, testId)
  assert.equal(response.body.assignment.allowLate, false)
  assert.equal(library.body.items.length, 1)
})

test('US44: a deadline in the past is refused', async () => {
  const { teacher, testId, classId } = await setUp()

  const response = await assign(teacher, classId, { testId, deadline: yesterday().toISOString() })

  assert.equal(response.status, 400)
})

test('US44: students cannot assign', async () => {
  const { student, testId, classId } = await setUp()

  const response = await assign(student, classId, { testId, deadline: tomorrow() })

  assert.equal(response.status, 404)
})

test('US45: the student sees todo, then submitted with their score; the teacher sees 1 of 1 handed in', async () => {
  const { teacher, student, testId, classId } = await setUp()
  const created = await assign(teacher, classId, { testId, deadline: tomorrow() })
  const assignmentId = created.body.assignment.id

  const before = await listFor(student, classId)
  const started = await request(app).post('/api/attempts').set('Authorization', student.authHeader).send({ testId, assignmentId, mode: fullMode })
  await request(app).post(`/api/attempts/${started.body.attempt.id}/submit`).set('Authorization', student.authHeader)
  const afterStudent = await listFor(student, classId)
  const afterTeacher = await listFor(teacher, classId)

  assert.equal(before.body.items[0].myStatus, 'todo')
  assert.equal(started.body.attempt.classId, classId)
  assert.equal(afterStudent.body.items[0].myStatus, 'submitted')
  assert.equal(afterStudent.body.items[0].myResult.total, 3)
  assert.equal(afterTeacher.body.items[0].submittedCount, 1)
  assert.equal(afterTeacher.body.items[0].studentCount, 1)
  // Submitted with no answers: 0 correct on average
  assert.equal(afterTeacher.body.items[0].averageCorrect, 0)
})

test('US44: after the deadline a student cannot start, unless late work is allowed (then it is marked late)', async () => {
  const { teacher, student, testId, classId } = await setUp()
  // Created directly in the database because the API refuses past deadlines
  const closed = await Assignment.create({ classId, testId, assignedBy: teacher.user.id, deadline: yesterday(), allowLate: false })
  const lateAllowed = await Assignment.create({ classId, testId, assignedBy: teacher.user.id, deadline: yesterday(), allowLate: true })

  const refused = await request(app).post('/api/attempts').set('Authorization', student.authHeader).send({ testId, assignmentId: closed.id, mode: fullMode })
  const started = await request(app).post('/api/attempts').set('Authorization', student.authHeader).send({ testId, assignmentId: lateAllowed.id, mode: fullMode })
  await request(app).post(`/api/attempts/${started.body.attempt.id}/submit`).set('Authorization', student.authHeader)
  const list = await listFor(student, classId)

  assert.equal(refused.status, 422)
  assert.equal(refused.body.error.code, 'DEADLINE_PASSED')
  assert.deepEqual(list.body.items.map((item) => item.myStatus).sort(), ['late', 'missed'])
})

test('US44: the teacher deletes an assignment', async () => {
  const { teacher, testId, classId } = await setUp()
  const created = await assign(teacher, classId, { testId, deadline: tomorrow() })

  const removed = await request(app).delete(`/api/classes/${classId}/assignments/${created.body.assignment.id}`).set('Authorization', teacher.authHeader)
  const list = await listFor(teacher, classId)

  assert.equal(removed.status, 204)
  assert.equal(list.body.items.length, 0)
})
