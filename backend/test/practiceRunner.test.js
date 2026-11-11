import test from 'node:test'
import assert from 'node:assert/strict'
import { readerPool } from '../src/config/readerPool.js'
import { runPracticeSql } from '../src/services/practiceRunner.js'

test.after(async () => {
  await readerPool.end()
})

test('chạy SELECT và trả cột, dòng', async () => {
  const result = await runPracticeSql('SELECT 1 AS x')
  assert.equal(result.rows.length, 1)
  assert.equal(result.rows[0].x, 1)
  assert.equal(result.columns[0].name, 'x')
  assert.equal(result.truncated, false)
})

test('đọc được bảng shop.orders bằng user chỉ đọc', async () => {
  const result = await runPracticeSql('SELECT id, status FROM orders ORDER BY id LIMIT 5')
  assert.equal(result.rowCount, 5)
  assert.equal(result.totalRows, 5)
  assert.equal(result.rows[0].id, 1)
})

test('cắt kết quả ở 200 dòng', async () => {
  const result = await runPracticeSql(
    'WITH RECURSIVE seq AS (SELECT 1 AS n UNION ALL SELECT n + 1 FROM seq WHERE n < 300) SELECT n FROM seq',
  )
  assert.equal(result.rowCount, 200)
  assert.equal(result.totalRows, 300)
  assert.equal(result.truncated, true)
})

test('truy vấn quá lâu trả lỗi QUERY_TIMEOUT', async () => {
  // SLEEP() bị MAX_EXECUTION_TIME ngắt nhưng trả về 1 thay vì lỗi,
  // nên dùng phép join nặng để MySQL thật sự ném ER_QUERY_TIMEOUT (3024).
  await assert.rejects(
    () =>
      runPracticeSql(
        'SELECT MD5(CONCAT(a.id, b.id, c.id, d.id)) AS h FROM orders a, orders b, orders c, orders d, orders e, orders f ORDER BY h LIMIT 200',
      ),
    { code: 'QUERY_TIMEOUT' },
  )
})
