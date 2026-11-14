import { test } from 'node:test'
import assert from 'node:assert/strict'
import { titleForPath } from './pageTitle.js'

test('each page has its own tab title', () => {
  assert.equal(titleForPath('/'), 'Trang chủ · Relis')
  assert.equal(titleForPath('/classes'), 'Lớp học · Relis')
  assert.equal(titleForPath('/classes/abc123'), 'Chi tiết lớp · Relis')
  assert.equal(titleForPath('/attempts/abc123'), 'Làm bài · Relis')
  assert.equal(titleForPath('/attempts/abc123/review'), 'Xem lại · Relis')
  assert.equal(titleForPath('/tests/abc123/edit'), 'Soạn đề · Relis')
})

test('an unknown address gets the not-found title', () => {
  assert.equal(titleForPath('/nothing-here'), 'Không tìm thấy trang · Relis')
})
