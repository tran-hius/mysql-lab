import test from 'node:test'
import assert from 'node:assert/strict'
import { pool } from '../src/config/db.js'
import { assertReadOnly } from '../src/services/sqlGuard.js'
import { runQuery } from '../src/services/queryRunner.js'

test.after(async () => {
  await pool.end()
})

test('guard chặn câu lệnh ghi', () => {
  assert.throws(() => assertReadOnly('DELETE FROM sales'), { code: 'SQL_NOT_ALLOWED' })
  assert.throws(() => assertReadOnly('SELECT 1; DROP TABLE sales'), { code: 'SQL_NOT_ALLOWED' })
})

test('guard cho phép SELECT và WITH có dấu ; cuối', () => {
  assert.doesNotThrow(() => assertReadOnly('SELECT 1;'))
  assert.doesNotThrow(() => assertReadOnly('WITH t AS (SELECT 1) SELECT * FROM t'))
})

test('runQuery trả null với id lạ', async () => {
  assert.equal(await runQuery('khong-ton-tai'), null)
})

test('runQuery trả kết quả cho overview', async (t) => {
  try {
    const result = await runQuery('overview')
    assert.equal(result.id, 'overview')
    assert.equal(result.rows.length, 1)
    assert.equal(result.rows[0].so_khach, 24)
    assert.ok(result.durationMs >= 0)
    assert.equal(result.truncated, false)
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ER_ACCESS_DENIED_ERROR') {
      t.skip('MySQL chưa sẵn sàng')
      return
    }
    throw error
  }
})

test('nhãn khách hàng kèm mã để phân biệt tên trùng', async (t) => {
  try {
    const result = await runQuery('top-customers')
    assert.equal(result.rows.length, 10)
    for (const row of result.rows) {
      assert.match(row.khach_hang, /\(#\d+\)$/)
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ER_ACCESS_DENIED_ERROR') {
      t.skip('MySQL chưa sẵn sàng')
      return
    }
    throw error
  }
})
