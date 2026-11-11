import test from 'node:test'
import assert from 'node:assert/strict'
import app from '../src/app.js'
import { readerPool } from '../src/config/readerPool.js'

let server
let baseUrl

test.before(async () => {
  server = app.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

test.after(async () => {
  await new Promise((resolve) => server.close(resolve))
  await readerPool.end()
})

const postSandbox = (body) =>
  fetch(`${baseUrl}/api/sandbox`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })

test('POST /api/sandbox chạy SELECT và trả cột, dòng', async () => {
  const response = await postSandbox({ sql: 'SELECT id, status FROM orders ORDER BY id LIMIT 3' })
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.equal(body.ok, true)
  assert.equal(body.rows.length, 3)
  assert.equal(body.rows[0].id, 1)
  assert.equal(body.columns[0].name, 'id')
  assert.equal(body.truncated, false)
})

test('POST /api/sandbox cho phép EXPLAIN', async () => {
  const response = await postSandbox({ sql: 'EXPLAIN SELECT * FROM orders' })
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.ok(body.rows.length > 0)
})

test('POST /api/sandbox chặn câu lệnh ghi bằng 400', async () => {
  const response = await postSandbox({ sql: 'DELETE FROM orders' })
  const body = await response.json()

  assert.equal(response.status, 400)
  assert.equal(body.error, 'SQL_NOT_ALLOWED')
})

test('POST /api/sandbox thiếu sql trả 400', async () => {
  const response = await postSandbox({})
  const body = await response.json()

  assert.equal(response.status, 400)
  assert.equal(body.error, 'SQL_NOT_ALLOWED')
})

test('POST /api/sandbox SQL sai trả 422 kèm message', async () => {
  const response = await postSandbox({ sql: 'SELECT khong_ton_tai FROM orders' })
  const body = await response.json()

  assert.equal(response.status, 422)
  assert.equal(body.error, 'SQL_ERROR')
  assert.match(body.message, /khong_ton_tai/i)
})

test('GET /api/schema trả đủ 9 bảng và cột của orders', async () => {
  const response = await fetch(`${baseUrl}/api/schema`)
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.equal(body.ok, true)
  assert.equal(body.database, 'shop')
  assert.equal(body.tables.length, 9)

  const orders = body.tables.find((table) => table.name === 'orders')
  assert.ok(orders, 'phải có bảng orders')
  assert.equal(orders.rowCount, 25)

  const status = orders.columns.find((column) => column.name === 'status')
  assert.ok(status, 'phải có cột orders.status')
  assert.match(status.type, /enum/i)
  assert.equal(status.nullable, false)
  assert.ok(Array.isArray(orders.sampleRows))
  assert.ok(orders.sampleRows.length > 0)
})
