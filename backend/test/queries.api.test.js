import test from 'node:test'
import assert from 'node:assert/strict'
import app from '../src/app.js'
import { pool } from '../src/config/db.js'

let server
let baseUrl

test.before(async () => {
  server = app.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

test.after(async () => {
  await new Promise((resolve) => server.close(resolve))
  await pool.end()
})

test('GET /api/queries trả danh sách, không có SQL', async () => {
  const response = await fetch(`${baseUrl}/api/queries`)
  const body = await response.json()
  assert.equal(response.status, 200)
  assert.equal(body.queries.length, 10)
  assert.ok(body.queries.every((q) => q.sql === undefined))
})

test('GET /api/queries/overview trả kết quả và SQL', async (t) => {
  const response = await fetch(`${baseUrl}/api/queries/overview`)
  const body = await response.json()
  if (response.status === 503) {
    t.skip('MySQL chưa sẵn sàng')
    return
  }
  assert.equal(response.status, 200)
  assert.equal(body.ok, true)
  assert.match(body.sql, /^SELECT/i)
  assert.equal(body.rowCount, 1)
})

test('GET /api/queries/khong-ton-tai trả 404', async () => {
  const response = await fetch(`${baseUrl}/api/queries/khong-ton-tai`)
  const body = await response.json()
  assert.equal(response.status, 404)
  assert.equal(body.error, 'QUERY_NOT_FOUND')
})
