import test from 'node:test'
import assert from 'node:assert/strict'
import { isDatabaseUnavailable } from '../src/services/dbError.js'

test('nhận diện lỗi mất kết nối MySQL', () => {
  const codes = [
    'ECONNREFUSED',
    'ER_ACCESS_DENIED_ERROR',
    'ER_BAD_DB_ERROR',
    'PROTOCOL_CONNECTION_LOST',
    'ETIMEDOUT',
    'ENOTFOUND',
    'ER_CON_COUNT_ERROR',
  ]

  for (const code of codes) {
    assert.equal(isDatabaseUnavailable({ code }), true, code)
  }

  assert.equal(isDatabaseUnavailable({ fatal: true }), true)
})

test('không xếp lỗi truy vấn thông thường vào DB_UNAVAILABLE', () => {
  assert.equal(isDatabaseUnavailable({ code: 'ER_NO_SUCH_TABLE' }), false)
  assert.equal(isDatabaseUnavailable({ code: 'ER_BAD_FIELD_ERROR' }), false)
  assert.equal(isDatabaseUnavailable(null), false)
})
